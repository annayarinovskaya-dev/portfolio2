// Generic, data-driven scroll-storytelling component.
//
// ScrollStory.create({ heroRoot, pinWrapper, mount, activateOn, laptop,
// screenshots, intro, sections, closing }) wires one case study's scroll
// narrative. See js/data/onboarding-story.js for the config shape a new
// case study needs to supply — nothing in this file is Onboarding-specific.
//
// ============================================================
// WHEEL-CAPTURE STATE MACHINE (setupPinned() > onWheel(), below)
// ============================================================
// The desktop pinned run doesn't map scroll distance to page progress — it's
// a fixed 100vh pin wrapper, and every wheel event over it is intercepted
// (preventDefault) to step through screens instead of scrolling the page.
// Steps themselves ARE paced by scroll distance, though: onWheel buffers
// incoming wheel input and fires one step per STEP_DISTANCE_PX of
// accumulated motion, so pacing tracks how far the user has scrolled rather
// than how long or how many discrete events their gesture happened to
// produce. Check new changes to onWheel/setEngaged/releaseForward/goToStep
// against this before relying on a manual repro to catch regressions.
//
// STATE
//   engaged          bool    — true while wheel events are being captured to
//                               step through screens; false while they pass
//                               through to native scroll.
//   stepIndex        0..N-1  — current screen/panel step. Only meaningful
//                               while engaged; left at its last value while
//                               disengaged (the next engage overwrites it).
//   exitDirection    null|1|-1 — while !engaged, which edge was just released
//                               from: 1 = mid-escape past the last step
//                               (scrolling forward/down), -1 = mid-escape past
//                               the first step (scrolling backward/up), null =
//                               not mid-escape (fresh approach, or already
//                               fully escaped). Persists across separate wheel
//                               gestures — geometry-scoped, not time-scoped —
//                               because a full escape needs many ~100px wheel
//                               notches against a 100vh pin, so the pin still
//                               "fillsViewport" for most of that distance.
//   scrollAccum      px      — running total of |deltaY| buffered since the
//                               last step fired (or since engage). This is
//                               the primary pacing signal: once it reaches
//                               STEP_DISTANCE_PX, one step fires and the
//                               buffer resets to 0. Using distance rather
//                               than event count or gesture duration means
//                               pacing is consistent regardless of how a
//                               device chops one physical motion into wheel
//                               events — a trackpad's long tail of small
//                               momentum deltas and a mouse's few large
//                               notches both take roughly the same amount of
//                               physical scrolling to advance one step.
//   lastStepTime     timestamp — performance.now() at the last engage/step/
//                               release. Enforces MIN_STEP_INTERVAL_MS as a
//                               floor between fired steps — see below.
//   fillsViewport    (derived, not stored) — pinWrapper's bounding rect is
//                               within one viewport height of the top, i.e.
//                               the pin currently occupies the screen.
//                               Recomputed from live layout on every event.
//
// Why a time floor still exists alongside distance pacing: some mice/wheels
// report one large deltaY per notch (occasionally exceeding
// STEP_DISTANCE_PX by itself), and rapid discrete notches from that kind of
// device could otherwise each independently clear the distance threshold
// within a handful of milliseconds of each other, firing several steps
// almost simultaneously — unreadable regardless of how much "distance" was
// nominally covered. MIN_STEP_INTERVAL_MS (150ms) bounds that: a step only
// fires once BOTH scrollAccum >= STEP_DISTANCE_PX AND at least
// MIN_STEP_INTERVAL_MS has elapsed since the previous step. In practice this
// floor is inert for normal trackpad motion (accumulating 120px of small
// deltas naturally takes well over 150ms) and only matters for
// large-delta/high-frequency input. It is a safety floor, not the primary
// pacing mechanism — distance is.
//
// TRANSITIONS (all inside onWheel(), guarded first by !engaged / engaged)
//   1. !engaged, exitDirection null or reversed (sign(deltaY) !== it),
//      fillsViewport true
//        -> ENGAGE: preventDefault, snap-scroll pinWrapper flush to the
//           viewport top, engaged=true, stepIndex = deltaY>0 ? 0 :
//           totalSteps-1 (enter from the edge matching scroll direction),
//           renderStep(stepIndex), lastStepTime=now, scrollAccum=0,
//           exitDirection=null.
//   2. !engaged, exitDirection null, fillsViewport false
//        -> no-op; let native scroll proceed (not near the pin at all).
//   3. !engaged, exitDirection = D, sign(deltaY) === D (still leaving in
//      the same direction as the last release)
//        -> no-op; let native scroll proceed (mid-escape, don't re-trap).
//           If fillsViewport is now false, clear exitDirection to null —
//           confirmed fully clear, future approaches are treated as fresh.
//   4. !engaged, exitDirection = D, sign(deltaY) !== D (user reverses
//      direction before fully escaping)
//        -> same as transition 1 (re-engage), after clearing exitDirection
//           first. Lands back on the edge step matching the new direction,
//           which is the step they just left — no jump.
//   5. engaged, scrollAccum (after adding |deltaY|) < STEP_DISTANCE_PX, OR
//      now - lastStepTime < MIN_STEP_INTERVAL_MS
//        -> preventDefault, no-op (still buffering distance, or still
//           within the time floor since the last step; either way, not
//           enough to act on yet).
//   6. engaged, scrollAccum >= STEP_DISTANCE_PX, time floor elapsed,
//      deltaY > 0, stepIndex < totalSteps - 1
//        -> ADVANCE: preventDefault, scrollAccum=0, lastStepTime=now,
//           goToStep(stepIndex+1).
//   7. engaged, scrollAccum >= STEP_DISTANCE_PX, time floor elapsed,
//      deltaY > 0, stepIndex === totalSteps - 1
//        -> RELEASE FORWARD: scrollAccum=0, releaseForward() (engaged=false,
//           does NOT restore the hero's own static .hero__screen or hide the
//           overlay — see releaseForward()'s own comment for why),
//           exitDirection=1, lastStepTime=now. Not preventDefault()ed:
//           native scroll starts carrying the page away in this same event.
//   8. engaged, scrollAccum >= STEP_DISTANCE_PX, time floor elapsed,
//      deltaY < 0, stepIndex > 0
//        -> RETREAT: preventDefault, scrollAccum=0, lastStepTime=now,
//           goToStep(stepIndex-1).
//   9. engaged, scrollAccum >= STEP_DISTANCE_PX, time floor elapsed,
//      deltaY < 0, stepIndex === 0
//        -> RELEASE BACKWARD: scrollAccum=0, setEngaged(false) (restores
//           hero__screen/hides overlay — safe here because the hero's
//           default screenshot already matches step 0), exitDirection=-1,
//           lastStepTime=now. Not preventDefault()ed, same reasoning as
//           transition 7.
//
// Outside onWheel: teardown() (case-tab switch away, or a pinned<->stacked
// mode change on resize) hard-resets everything — removes the overlay and
// listeners, clears activePinStep. setupPinned() re-running (case-tab switch
// back, or mode change back to pinned) recreates the whole closure, so all
// of the above starts fresh at stepIndex=0, engaged=false, exitDirection=null,
// scrollAccum=0.
// ============================================================
(function () {
  'use strict';

  // Primary pacing signal for the wheel-capture stepper (see setupPinned()
  // below): a step fires once this many px of |deltaY| have accumulated
  // since the last step (or since engage). See the state-machine comment
  // above for the full transition table.
  var STEP_DISTANCE_PX = 120;

  // Safety floor alongside STEP_DISTANCE_PX: a step can fire again only
  // once this many ms have elapsed since the last one, even if scrollAccum
  // already cleared STEP_DISTANCE_PX. Guards against a device that reports
  // large deltaY per notch firing several steps within milliseconds of each
  // other — see the state-machine comment above for why distance alone
  // isn't enough there.
  var MIN_STEP_INTERVAL_MS = 150;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Matches the breakpoint the hero itself already drops its screen layer at.
  function isMobileViewport() {
    return window.matchMedia('(max-width: 980px)').matches;
  }

  // Shared with initProgressTrail(): while a pinned run's wheel-capture
  // stepper is engaged, window.scrollY is frozen (every wheel event is
  // preventDefault()ed), so the page-level progress marker below has no
  // scroll delta to react to. setupPinned() reports local step progress
  // here so the marker can keep moving in sync with stepIndex instead of
  // sitting inert for the whole duration of the pinned interaction.
  var activePinStep = null; // { pinWrapper, frac } | null

  function calloutHTML(callout) {
    if (!callout) return '';
    if (callout.type === 'quote') {
      return '<blockquote class="story__quote">' + callout.text + '</blockquote>';
    }
    if (callout.type === 'list') {
      return '<ul class="story__panel-list">' +
        callout.items.map(function (item) { return '<li>' + item + '</li>'; }).join('') +
        '</ul>';
    }
    if (callout.type === 'stat-list') {
      return '<ul class="story__stat-list">' +
        callout.items.map(function (item) { return '<li>' + item.label + '</li>'; }).join('') +
        '</ul>';
    }
    return '';
  }

  // Sections without a `number` (e.g. a hook beat ahead of the numbered
  // sequence) render the kicker alone — no leading "undefined —" or blank
  // number segment.
  function captionHTML(section) {
    return '<span class="story__caption">' + (section.number ? section.number + ' - ' : '') + section.kicker + '</span>';
  }

  // Page-level progress trail — one instance for the whole page, independent
  // of which case tab is active or whether that case even has a ScrollStory
  // pinned sequence at all (only case 3 does). Created once at load time and
  // never torn down, so it stays present across case-tab switches. Fill is
  // plain continuous scroll position — current scrollY over the distance
  // from the top of the page to the bottom of #case-detail — with no
  // per-case weighting, so it behaves identically whether or not the
  // current case has a pinned sequence in the middle of that scroll range.
  function initProgressTrail() {
    // One #case-detail-N section is active at a time (see main.js
    // initCaseDetailToggle) — re-queried on every update() rather than
    // cached, since which one is active changes on case-tab switch.
    function activeCaseDetailEl() {
      return document.querySelector('.case-detail.is-active');
    }
    const storyEl = document.getElementById('story');
    if (!activeCaseDetailEl()) return;

    const progress = document.createElement('div');
    progress.className = 'story__progress';
    progress.innerHTML =
      '<button type="button" class="story__progress-top">' +
        '<span class="story__progress-top-icon" aria-hidden="true"></span>' +
        '<span class="story__progress-top-label">Back to top</span>' +
      '</button>' +
      '<span class="story__progress-line"></span>' +
      '<span class="story__progress-marker"></span>' +
      '<span class="story__progress-hint">Scroll down to case study</span>';
    document.body.appendChild(progress);

    const progressMarker = progress.querySelector('.story__progress-marker');
    progress.querySelector('.story__progress-top').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    });

    // The trail is positioned once (not re-computed on every scroll tick,
    // the way the old footer-docking logic below used to) so it truly
    // holds its place while the line/marker animate beside it — a plain
    // position:fixed box left alone already stays put across scroll, so
    // there's nothing more to do per-frame once the position is set.
    //
    // That position is derived from two other elements' live geometry
    // rather than fixed vh guesses, matching the left-hand rail it's meant
    // to echo:
    //  - bottom edge -> bottom of the hero's case description text (the
    //    subtext under the big case title), so the line/marker/hint read
    //    as bottom-aligned with that paragraph's baseline, not floating
    //    independently.
    //  - height -> the left-side .case-nav's own rendered height (the
    //    01/02/03 stack + its gaps), so both vertical lines read as the
    //    same length instead of one being CSS's 34vh guess.
    // A ResizeObserver on both source elements — not just a window resize
    // listener — re-measures whenever either one's box actually changes
    // size, which covers a viewport resize but also a case switch: the
    // hero's case description text differs in length per case (see CASES
    // in main.js) and can wrap to a different number of lines, shifting
    // its height independently of the viewport.
    //
    // A case switch's text swap (renderCase() in main.js) also drives a
    // translateY/opacity transition on the title+desc themselves (see
    // .is-switching in styles.css) that starts at the very same moment the
    // text — and so the box height ResizeObserver reacts to — changes.
    // getBoundingClientRect() reflects that transform mid-flight, so a
    // measurement taken right as the resize fires can catch the description
    // a few px off its resting position; re-measuring again on
    // transitionend corrects it once the transform settles.
    const heroDescEl = document.querySelector('.case-card__desc');
    const heroTitleEl = document.querySelector('.case-card__title');
    const caseNavEl = document.querySelector('.case-nav');
    function positionTrail() {
      if (!heroDescEl || !caseNavEl) return;
      const descRect = heroDescEl.getBoundingClientRect();
      const navHeight = caseNavEl.getBoundingClientRect().height;
      progress.style.height = navHeight + 'px';
      progress.style.top = (descRect.bottom - navHeight) + 'px';
      progress.style.bottom = 'auto';
    }
    positionTrail();
    const trailResizeObserver = new ResizeObserver(positionTrail);
    [heroDescEl, heroTitleEl, caseNavEl].forEach(function (el) {
      if (el) trailResizeObserver.observe(el);
    });
    if (heroDescEl) heroDescEl.addEventListener('transitionend', positionTrail);
    if (heroTitleEl) heroTitleEl.addEventListener('transitionend', positionTrail);
    // Belt-and-suspenders re-triggers: a webfont swap can reflow the case
    // title/description after ResizeObserver's initial reading (e.g. if the
    // font finishes loading after these elements already have a box) without
    // firing resize or transitionend on them.
    window.addEventListener('load', positionTrail);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(positionTrail);
    }

    let raf = null;
    function update() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        const caseDetailEl = activeCaseDetailEl();
        if (!caseDetailEl) return;
        const scrollY = window.scrollY || window.pageYOffset;
        const caseDetailRect = caseDetailEl.getBoundingClientRect();
        // Reference point for the fill target below: the EMAIL/LINKEDIN
        // links themselves (.about-meta, reused from the About page — see
        // index.html), not the whole footer row, so the marker's travel
        // distance is pinned to that exact underline even if the footer's
        // own box gains padding or the "next case study" column changes
        // height. Falls back to the footer, then the section, if a case's
        // footer is ever missing that markup.
        const footerEl = caseDetailEl.querySelector('.case-detail__footer');
        const footerLinksEl = footerEl ? footerEl.querySelector('.about-meta') : null;
        const fillEndRect = (footerLinksEl || footerEl || caseDetailEl).getBoundingClientRect();
        const targetScrollY = Math.max(1, (fillEndRect.bottom + scrollY) - window.innerHeight);
        const baseFrac = Math.min(1, Math.max(0, scrollY / targetScrollY));

        // While a pinned run is actively stepping, scrollY sits fixed at
        // the position it had on engage, so baseFrac alone would leave the
        // marker frozen for the whole interaction. Nudge it forward within
        // the slice of the trail the pin's own 100vh occupies, in step with
        // stepIndex, so it keeps visibly advancing.
        let frac = baseFrac;
        if (activePinStep) {
          const weight = Math.min(1, window.innerHeight / targetScrollY);
          frac = Math.min(1, baseFrac + activePinStep.frac * weight);
        }

        // Track length/position is the trail's own fixed screen box
        // (unaffected by frac) — the marker travels along it via
        // translateY, the line itself never changes size or position.
        const progressRect = progress.getBoundingClientRect();
        const trackHeightPx = progressRect.height;
        progressMarker.style.transform = 'translateY(-50%) translateY(' + (frac * trackHeightPx) + 'px)';

        progress.classList.toggle('is-visible', caseDetailRect.bottom > 0);
        // Once the footer band has substantially entered the viewport, the
        // line/marker's job — tracking progress through the still-scrolling
        // middle of the page — is done, so drop them (see
        // .story__progress.at-page-end in scroll-story.css); the vertical
        // "Back to top" label itself stays, still governed by hero-covered
        // below, so it keeps reading at the very bottom of the page.
        const footerRect = footerEl ? footerEl.getBoundingClientRect() : null;
        const footerInView = footerRect ? footerRect.top < window.innerHeight * 0.85 : false;
        progress.classList.toggle('at-page-end', footerInView);
        // Swaps the off-white line/marker/hint to dark ink once white
        // background actually reaches the trail's own fixed on-screen
        // midpoint — not once the whole #story-pin wrapper has scrolled
        // past, which lags well behind that point. #story is also white
        // and, for a case with real flow content there (case 3's closing
        // cta), rises into view before #case-detail does — so the
        // relevant boundary is whichever of the two has risen furthest.
        // For cases with an empty #story, its rect coincides with (or
        // sits below) #case-detail's, so the min is just #case-detail's
        // top, unaffected.
        const storyRect = storyEl ? storyEl.getBoundingClientRect() : null;
        const whiteTop = storyRect ? Math.min(storyRect.top, caseDetailRect.top) : caseDetailRect.top;
        const trailMidY = progressRect.top + progressRect.height / 2;
        progress.classList.toggle('is-on-light', whiteTop <= trailMidY);
        // The "scroll down" hint fades on the first real scroll tick, on
        // every case (not just case 3's pin handoff, which cases 1/2 never
        // trigger).
        progress.classList.toggle('has-scrolled', scrollY > 0);
        // "Back to top" only earns its place once the landing hero is
        // completely covered by the case study — same handoff point
        // nav-hidden below uses (#case-detail's top reaching the viewport
        // top), not the first scroll tick.
        progress.classList.toggle('hero-covered', caseDetailRect.top <= 0);

        // Side nav sits fixed above everything (z-index 11) so it would
        // otherwise float over the case study once #case-detail rises to
        // cover the hero — hide it right at that handoff point (its top
        // reaching the viewport top) and bring it back once the user
        // scrolls back up past it.
        document.body.classList.toggle('nav-hidden', caseDetailRect.top <= 0);
      });
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  initProgressTrail();

  function create(config) {
    const heroRoot = config.heroRoot;
    const pinWrapper = config.pinWrapper;
    const mount = config.mount;
    const laptop = config.laptop;
    const video = config.video;
    const screenshots = config.screenshots || [];
    const introScreens = (config.intro && config.intro.screens) || [];
    const hasIntro = introScreens.length > 0;
    const sections = config.sections || [];
    const closing = config.closing;
    const activateOn = String(config.activateOn);

    const shotMap = {};
    screenshots.forEach(function (s) { shotMap[s.id] = s; });

    let armed = false;
    let mode = null; // 'pinned' | 'stacked'
    let cleanupFns = [];

    function teardown() {
      cleanupFns.forEach(function (fn) { fn(); });
      cleanupFns = [];
      mount.innerHTML = '';
      mount.classList.remove('no-motion');
      activePinStep = null;
      heroRoot.classList.remove('is-pinned', 'is-handoff');
      const overlay = heroRoot.querySelector('.story__pin-overlay');
      if (overlay) overlay.remove();
      pinWrapper.style.height = '';
      pinWrapper.classList.remove('is-armed');
      armed = false;
      mode = null;
    }

    function flowSectionEl(section) {
      const el = document.createElement('div');
      el.className = 'story__flow-section';
      el.innerHTML =
        captionHTML(section) +
        '<h3 class="story__flow-heading">' + section.heading + '</h3>' +
        '<p class="story__flow-body">' + section.body + '</p>' +
        calloutHTML(section.callout);
      return el;
    }

    function mobileLaptopHTML(shot) {
      if (!shot) return '';
      const pct = LaptopMockup.screenRectPercent(laptop);
      return (
        '<div class="story__mobile-laptop">' +
          '<img class="story__mobile-laptop-photo" src="' + laptop.photo + '" alt="">' +
          '<img class="story__mobile-laptop-screen" style="left:' + pct.left + '%;top:' + pct.top + '%;width:' + pct.width + '%;height:' + pct.height + '%" src="' + shot.src + '" alt="' + (shot.alt || '') + '">' +
        '</div>'
      );
    }

    function stackedTeaserEl(screen) {
      const el = document.createElement('div');
      el.className = 'story__mobile-teaser';
      el.innerHTML =
        mobileLaptopHTML(shotMap[screen.screenshot]) +
        '<p class="story__teaser-line story__teaser-line--mobile">' + screen.line + '</p>';
      return el;
    }

    function stackedSectionEl(section) {
      const el = document.createElement('div');
      el.className = 'story__mobile-block';
      el.innerHTML =
        mobileLaptopHTML(shotMap[section.screenshot]) +
        '<h3 class="story__flow-heading' + (section.plainHeading ? ' story__flow-heading--plain' : '') + '">' + section.heading + '</h3>' +
        '<p class="story__flow-body">' + section.body + '</p>' +
        calloutHTML(section.callout);
      return el;
    }

    function closingEl(cfg) {
      const el = document.createElement('div');
      el.className = 'story__closing';
      el.innerHTML =
        '<a class="story__closing-cue" href="' + (cfg.href || '#top') + '">' +
          '<span class="story__closing-cue-text">' + cfg.text + '</span>' +
        '</a>';
      return el;
    }

    function observeReveal(root, reduced) {
      const targets = root.querySelectorAll('.story__flow-section, .story__closing-cue, .story__mobile-block, .story__mobile-teaser');
      if (reduced) {
        targets.forEach(function (el) { el.classList.add('is-visible'); });
        return function () {};
      }
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      }, { threshold: 0.2 });
      targets.forEach(function (el) { io.observe(el); });
      return function () { io.disconnect(); };
    }

    function setupStacked(reduced) {
      const frag = document.createDocumentFragment();
      introScreens.forEach(function (screen) { frag.appendChild(stackedTeaserEl(screen)); });
      sections.forEach(function (section) { frag.appendChild(stackedSectionEl(section)); });
      if (closing) frag.appendChild(closingEl(closing));
      mount.appendChild(frag);

      if (reduced) mount.classList.add('no-motion');
      const disconnect = observeReveal(mount, reduced);
      cleanupFns.push(disconnect);
    }

    function setupPinned() {
      heroRoot.classList.add('is-pinned');

      const overlay = document.createElement('div');
      overlay.className = 'story__pin-overlay';

      const teaserHTML = introScreens.map(function (screen, i) {
        return '<p class="story__teaser-line" data-index="' + i + '">' + screen.line + '</p>';
      }).join('');

      const panelHTML = sections.map(function (section, i) {
        return (
          '<div class="story__panel-block" data-index="' + i + '">' +
            (section.number ? '<span class="story__panel-number">' + section.number + '</span>' : '') +
            '<h3 class="story__panel-heading' + (section.plainHeading ? ' story__panel-heading--plain' : '') + '">' + section.heading + '</h3>' +
            '<p class="story__panel-body">' + section.body + '</p>' +
            calloutHTML(section.callout) +
          '</div>'
        );
      }).join('');

      // The laptop screen plays a single looping walkthrough video rather
      // than crossfading between per-step screenshots — it isn't tied to
      // stepIndex at all, just runs continuously behind the stepped
      // teaser/panel content.
      const screenHTML = '<video class="story__screen-video" src="' + video + '" autoplay muted loop playsinline aria-hidden="true"></video>';

      overlay.innerHTML =
        (hasIntro ? '<div class="story__teaser">' + teaserHTML + '</div>' : '') +
        '<div class="story__panel">' + panelHTML + '</div>' +
        '<div class="story__screen">' + screenHTML + '</div>';

      heroRoot.appendChild(overlay);

      const teaserLines = overlay.querySelectorAll('.story__teaser-line');
      const panelBlocks = overlay.querySelectorAll('.story__panel-block');
      const screenEl = overlay.querySelector('.story__screen');

      const totalSteps = introScreens.length + sections.length;
      pinWrapper.classList.add('is-armed');

      function positionScreen() {
        const rect = LaptopMockup.computeScreenRect(heroRoot, laptop);
        screenEl.style.left = rect.left + 'px';
        screenEl.style.top = rect.top + 'px';
        screenEl.style.width = rect.width + 'px';
        screenEl.style.height = rect.height + 'px';
        screenEl.style.borderRadius = Math.max(3, rect.width * 0.015) + 'px';
      }

      // The wrapper is exactly one viewport tall — no extra scroll runway.
      // Advancing through the steps happens by intercepting wheel gestures
      // (below) instead of mapping a scroll distance to progress.
      pinWrapper.style.height = '100vh';
      positionScreen();

      let stepIndex = 0;
      let engaged = false;
      let lastStepTime = 0;
      let scrollAccum = 0;
      // Persists across separate wheel gestures (unlike lastStepTime's
      // MIN_STEP_INTERVAL_MS floor) until the pin is confirmed off-screen or
      // the user reverses direction. 1 = mid-escape scrolling forward off
      // the last step, -1 = mid-escape scrolling backward off the first
      // step, null = not mid-escape (fresh approach or fully exited). See
      // onWheel.
      let exitDirection = null;

      function renderStep(index) {
        const inIntro = hasIntro && index < introScreens.length;
        if (inIntro) {
          teaserLines.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
          panelBlocks.forEach(function (el) { el.classList.remove('is-active'); });
        } else {
          const sectionIndex = index - introScreens.length;
          panelBlocks.forEach(function (el, i) { el.classList.toggle('is-active', i === sectionIndex); });
          teaserLines.forEach(function (el) { el.classList.remove('is-active'); });
        }
        // Feeds the page-level progress marker (see activePinStep above) —
        // only while actively stepping, so it doesn't linger stale once the
        // interaction ends. The trail only recomputes on 'scroll'/'resize'
        // (see initProgressTrail), and real scroll is frozen for the whole
        // pinned interaction (every wheel event is preventDefault()ed), so
        // a synthetic 'scroll' nudges it to pick up the new step fraction.
        if (engaged) {
          activePinStep = { pinWrapper: pinWrapper, frac: totalSteps > 1 ? index / (totalSteps - 1) : 0 };
          window.dispatchEvent(new Event('scroll'));
        }
      }

      function setEngaged(next) {
        engaged = next;
        heroRoot.classList.toggle('is-handoff', engaged);
        overlay.classList.toggle('is-visible', engaged);
        if (!next) activePinStep = null;
      }

      // Releases wheel capture without restoring the hero's own static
      // screen or hiding the overlay. Used only when the user steps forward
      // off the last step: setEngaged(false) here would immediately fade
      // the overlay's true last screen back out and fade the hero's own
      // static .hero__screen back in — which is hard-coded in main.js to
      // the *first* story screen — flashing a reset to screen 1 while
      // #case-detail is still rising to cover it. Leaving is-handoff/the
      // overlay alone lets the last screen ride out of view untouched as
      // the hero scrolls away; the backward-exit path below still uses the
      // full setEngaged(false), which is safe there because the hero's
      // default screenshot already matches step 0.
      //
      // Also un-arms the pin wrapper (removes is-armed, drops the 100vh
      // collapse) so the generic CSS-only pin-and-cover handoff — suppressed
      // by is-armed for the duration of the step-through interaction, see
      // the file-level comment — takes back over for the rest of the page,
      // same as case studies 1/2. This runs synchronously in the same
      // onWheel() call that triggers it, and the triggering event is not
      // preventDefault()ed on this path, so the extra scroll runway this
      // restores appears below the current viewport before native scroll
      // applies that same event — no visual jump.
      function releaseForward() {
        engaged = false;
        activePinStep = null;
        pinWrapper.classList.remove('is-armed');
        pinWrapper.style.height = '';
      }

      function goToStep(next) {
        stepIndex = Math.max(0, Math.min(totalSteps - 1, next));
        renderStep(stepIndex);
      }

      // Two independent guards on engaged-branch step changes:
      //  - scrollAccum / STEP_DISTANCE_PX: the primary pacing signal —
      //    buffers |deltaY| and fires one step per STEP_DISTANCE_PX of
      //    accumulated motion, so pacing tracks scroll distance rather than
      //    event count or gesture duration.
      //  - lastStepTime / MIN_STEP_INTERVAL_MS: a safety floor between
      //    fired steps, so a device reporting one large deltaY per notch
      //    can't clear the distance threshold several times within
      //    milliseconds and fire multiple steps at once.
      // See the state-machine comment at the top of the file for the full
      // transition table this implements.
      //
      // Escaping the pin (once past the last/first step) is a separate
      // concern from either of those: it takes many separate wheel events,
      // since each notch is ~100px against a 100vh pin, and pinWrapper still
      // "fillsViewport" for most of that distance. `exitDirection` tracks
      // which edge we just released from and blocks re-engaging on further
      // wheel input in that same direction until the pin is confirmed fully
      // off-screen (fillsViewport false). Reversing direction mid-escape
      // re-engages immediately, landing back on the edge step it matches.
      function onWheel(e) {
        const now = performance.now();

        const wrapRect = pinWrapper.getBoundingClientRect();
        const fillsViewport = wrapRect.top <= 0 && wrapRect.top > -window.innerHeight && wrapRect.bottom > 0;

        if (!engaged) {
          const leavingSameDirection = exitDirection !== null && Math.sign(e.deltaY) === exitDirection;
          if (leavingSameDirection) {
            if (!fillsViewport) exitDirection = null;
            return;
          }
          exitDirection = null;

          if (!fillsViewport) return;
          e.preventDefault();
          if (Math.abs(wrapRect.top) > 0.5) window.scrollBy(0, wrapRect.top);
          setEngaged(true);
          lastStepTime = now;
          scrollAccum = 0;
          stepIndex = e.deltaY > 0 ? 0 : totalSteps - 1;
          renderStep(stepIndex);
          return;
        }

        scrollAccum += Math.abs(e.deltaY);

        if (scrollAccum < STEP_DISTANCE_PX || now - lastStepTime < MIN_STEP_INTERVAL_MS) {
          e.preventDefault();
          return;
        }

        if (e.deltaY > 0) {
          if (stepIndex < totalSteps - 1) {
            e.preventDefault();
            scrollAccum = 0;
            lastStepTime = now;
            goToStep(stepIndex + 1);
          } else {
            scrollAccum = 0;
            releaseForward();
            exitDirection = 1;
            lastStepTime = now;
          }
        } else if (e.deltaY < 0) {
          if (stepIndex > 0) {
            e.preventDefault();
            scrollAccum = 0;
            lastStepTime = now;
            goToStep(stepIndex - 1);
          } else {
            scrollAccum = 0;
            setEngaged(false);
            exitDirection = -1;
            lastStepTime = now;
          }
        }
      }

      renderStep(0);

      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('resize', positionScreen);
      cleanupFns.push(function () {
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('resize', positionScreen);
      });

      if (closing) {
        const frag = document.createDocumentFragment();
        frag.appendChild(closingEl(closing));
        mount.appendChild(frag);
        cleanupFns.push(observeReveal(mount, false));
      }
    }

    function currentTargetMode() {
      return (prefersReducedMotion() || isMobileViewport()) ? 'stacked' : 'pinned';
    }

    function setup() {
      if (armed) return;
      armed = true;
      mode = currentTargetMode();
      if (mode === 'pinned') setupPinned();
      else setupStacked(prefersReducedMotion());
    }

    document.addEventListener('onboarding:case-change', function (e) {
      const id = String(e.detail && e.detail.id);
      if (id === activateOn) setup();
      else teardown();
    });

    let resizeTimer = null;
    window.addEventListener('resize', function () {
      if (!armed) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        const next = currentTargetMode();
        if (next !== mode) {
          teardown();
          armed = false;
          mode = next;
          setup();
        }
      }, 150);
    });

    return { setup: setup, teardown: teardown };
  }

  window.ScrollStory = { create: create };
})();

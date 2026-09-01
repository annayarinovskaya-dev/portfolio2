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
// The desktop pinned run doesn't map scroll distance to progress — it's a
// fixed 100vh pin wrapper, and every wheel event over it is intercepted
// (preventDefault) to step through screens instead of scrolling the page.
// Check new changes to onWheel/setEngaged/releaseForward/goToStep against
// this before relying on a manual repro to catch regressions.
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
//   lastStepTime     timestamp — performance.now() at the last engage/step/
//                               release. Throttles engaged-branch step changes
//                               to one per MIN_STEP_INTERVAL_MS, so a
//                               sustained motion steps at a readable pace
//                               instead of firing on every wheel event.
//   lastEventTime    timestamp — performance.now() at the previous wheel
//                               event, of ANY kind, anywhere on the page.
//                               Used only to detect gesture boundaries (see
//                               gestureStepCount) — unrelated to lastStepTime.
//   gestureStepCount count    — steps already fired within the current
//                               gesture. A "gesture" here means "no gap since
//                               the previous wheel event has exceeded
//                               GESTURE_SILENCE_MS yet" — i.e. there's been no
//                               real pause, so this is still plausibly the
//                               same continuous physical motion (an active
//                               drag, or one flick's momentum decaying).
//                               Capped at MAX_STEPS_PER_GESTURE: once spent,
//                               further wheel input in the same gesture is
//                               still captured (preventDefault) but inert
//                               until a real pause resets the count. This
//                               exists because MIN_STEP_INTERVAL_MS pacing
//                               alone doesn't bound how far ONE released
//                               flick can travel — real trackpad momentum
//                               commonly decays over 1.5–2.5+ seconds, long
//                               enough to traverse an entire short sequence
//                               at a 220ms cadence. GESTURE_SILENCE_MS (400ms)
//                               is deliberately larger than MIN_STEP_INTERVAL_MS
//                               (220ms): a silence threshold *tighter* than
//                               that would fragment one real decelerating
//                               flick into several "gestures" (each getting
//                               its own fresh budget), which defeats the cap
//                               — confirmed against a real decaying-gap trace
//                               (50ms → 567ms) where individual gaps only
//                               cross 220ms well before the flick would
//                               naturally be considered "over". A side effect:
//                               very rapid repeated discrete inputs (under
//                               ~400ms apart) get bucketed into one gesture
//                               and capped too — treated as acceptable, since
//                               genuinely deliberate discrete actions are
//                               rarely that close together.
//   fillsViewport    (derived, not stored) — pinWrapper's bounding rect is
//                               within one viewport height of the top, i.e.
//                               the pin currently occupies the screen.
//                               Recomputed from live layout on every event.
//
// TRANSITIONS (all inside onWheel(), guarded first by !engaged / engaged)
//   Every event first updates gesture-boundary bookkeeping: if
//   now - lastEventTime > GESTURE_SILENCE_MS, gestureStepCount resets to 0
//   (a real pause occurred — whatever comes next is a fresh gesture, wherever
//   it's evaluated below). lastEventTime is then always updated to now.
//
//   1. !engaged, exitDirection null or reversed (sign(deltaY) !== it),
//      fillsViewport true
//        -> ENGAGE: preventDefault, snap-scroll pinWrapper flush to the
//           viewport top, engaged=true, stepIndex = deltaY>0 ? 0 :
//           totalSteps-1 (enter from the edge matching scroll direction),
//           renderStep(stepIndex), lastStepTime=now, gestureStepCount=0,
//           exitDirection=null. (Engaging doesn't itself spend the gesture
//           budget — it's a transition, not an advance/retreat/release.)
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
//   5. engaged, now - lastStepTime < MIN_STEP_INTERVAL_MS
//        -> preventDefault, no-op (still capturing scroll; too soon since
//           the last step to act again).
//   6. engaged, throttle elapsed, gestureStepCount >= MAX_STEPS_PER_GESTURE
//        -> preventDefault, no-op (this gesture has spent its step budget;
//           stays pinned at the current step until a real pause — see the
//           gesture-boundary bookkeeping above — starts a fresh one).
//   7. engaged, throttle elapsed, budget available, deltaY > 0,
//      stepIndex < totalSteps - 1
//        -> ADVANCE: preventDefault, lastStepTime=now, gestureStepCount++,
//           goToStep(stepIndex+1).
//   8. engaged, throttle elapsed, budget available, deltaY > 0,
//      stepIndex === totalSteps - 1
//        -> RELEASE FORWARD: releaseForward() (engaged=false, does NOT
//           restore the hero's own static .hero__screen or hide the
//           overlay — see releaseForward()'s own comment for why),
//           exitDirection=1, lastStepTime=now, gestureStepCount++. Not
//           preventDefault()ed: native scroll starts carrying the page away
//           in this same event.
//   9. engaged, throttle elapsed, budget available, deltaY < 0, stepIndex > 0
//        -> RETREAT: preventDefault, lastStepTime=now, gestureStepCount++,
//           goToStep(stepIndex-1).
//  10. engaged, throttle elapsed, budget available, deltaY < 0,
//      stepIndex === 0
//        -> RELEASE BACKWARD: setEngaged(false) (restores hero__screen/hides
//           overlay — safe here because the hero's default screenshot
//           already matches step 0), exitDirection=-1, lastStepTime=now,
//           gestureStepCount++. Not preventDefault()ed, same reasoning as
//           transition 8.
//
// Outside onWheel: teardown() (case-tab switch away, or a pinned<->stacked
// mode change on resize) hard-resets everything — removes the overlay and
// listeners, clears activePinStep. setupPinned() re-running (case-tab switch
// back, or mode change back to pinned) recreates the whole closure, so all
// of the above starts fresh at stepIndex=0, engaged=false, exitDirection=null,
// gestureStepCount=0.
// ============================================================
(function () {
  'use strict';

  // Throttles step changes while the wheel-capture stepper is engaged (see
  // setupPinned() below): a step can fire again once this many ms have
  // elapsed since the last one. See the state-machine comment above for how
  // this combines with GESTURE_SILENCE_MS/MAX_STEPS_PER_GESTURE below.
  var MIN_STEP_INTERVAL_MS = 220;

  // A gap since the previous wheel event larger than this means a real
  // pause happened — whatever comes next is a new gesture, and gets a fresh
  // step budget (see gestureStepCount in the state-machine comment above).
  // Deliberately larger than MIN_STEP_INTERVAL_MS: real trackpad momentum
  // decays gradually, with individual gaps growing past 220ms well before
  // the motion is actually over, so a threshold that small would fragment
  // one flick into several gestures and defeat the cap below.
  var GESTURE_SILENCE_MS = 400;

  // How many steps one gesture (see GESTURE_SILENCE_MS) may auto-advance
  // before further wheel input in that same gesture is captured but inert.
  // Bounds how far a single released flick can carry the story — pacing
  // alone (MIN_STEP_INTERVAL_MS) doesn't, since real momentum can keep
  // feeding wheel events for 1.5-2.5+ seconds, long enough at a 220ms
  // cadence to traverse an entire short sequence in one motion.
  var MAX_STEPS_PER_GESTURE = 2;

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
    return '<span class="story__caption">' + (section.number ? section.number + ' — ' : '') + section.kicker + '</span>';
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
    const caseDetailEl = document.getElementById('case-detail');
    const storyEl = document.getElementById('story');
    if (!caseDetailEl) return;

    const progress = document.createElement('div');
    progress.className = 'story__progress';
    progress.innerHTML =
      '<span class="story__progress-line"></span>' +
      '<span class="story__progress-marker"></span>' +
      '<span class="story__progress-hint">Scroll down to case study</span>';
    document.body.appendChild(progress);

    const progressMarker = progress.querySelector('.story__progress-marker');

    let raf = null;
    function update() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        const scrollY = window.scrollY || window.pageYOffset;
        const caseDetailRect = caseDetailEl.getBoundingClientRect();
        const targetScrollY = Math.max(1, (caseDetailRect.bottom + scrollY) - window.innerHeight);
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
        captionHTML(section) +
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
            '<p class="story__panel-kicker">' + section.kicker + '</p>' +
            '<h3 class="story__panel-heading' + (section.plainHeading ? ' story__panel-heading--plain' : '') + '">' + section.heading + '</h3>' +
            '<p class="story__panel-body">' + section.body + '</p>' +
            calloutHTML(section.callout) +
          '</div>'
        );
      }).join('');

      // One ordered list of screen frames spanning both beats, so the laptop
      // screen crossfades continuously across the whole pinned run instead of
      // resetting between the teaser and the full sections.
      const frameShots = introScreens.map(function (s) { return shotMap[s.screenshot]; })
        .concat(sections.map(function (s) { return shotMap[s.screenshot]; }));

      const screenHTML = frameShots.map(function (shot, i) {
        return '<img class="story__screen-frame" data-index="' + i + '" src="' + shot.src + '" alt="' + (shot.alt || '') + '">';
      }).join('');

      overlay.innerHTML =
        (hasIntro ? '<div class="story__teaser">' + teaserHTML + '</div>' : '') +
        '<div class="story__panel">' + panelHTML + '</div>' +
        '<div class="story__screen">' + screenHTML + '</div>';

      heroRoot.appendChild(overlay);

      const teaserLines = overlay.querySelectorAll('.story__teaser-line');
      const panelBlocks = overlay.querySelectorAll('.story__panel-block');
      const screenFrames = overlay.querySelectorAll('.story__screen-frame');
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
      let lastEventTime = 0;
      let gestureStepCount = 0;
      // Persists across separate wheel gestures (unlike lastStepTime's
      // throttle window, which only spans MIN_STEP_INTERVAL_MS) until the
      // pin is confirmed off-screen or the user reverses direction. 1 =
      // mid-escape scrolling forward off the last step, -1 = mid-escape
      // scrolling backward off the first step, null = not mid-escape (fresh
      // approach or fully exited). See onWheel.
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
        screenFrames.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });

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
      function releaseForward() {
        engaged = false;
        activePinStep = null;
      }

      function goToStep(next) {
        stepIndex = Math.max(0, Math.min(totalSteps - 1, next));
        renderStep(stepIndex);
      }

      // Two independent guards on engaged-branch step changes:
      //  - lastStepTime / MIN_STEP_INTERVAL_MS: paces steps within a
      //    gesture so they're readable, not one per wheel event.
      //  - lastEventTime+gestureStepCount / GESTURE_SILENCE_MS+
      //    MAX_STEPS_PER_GESTURE: bounds how far ONE gesture (no real pause
      //    yet) can carry the story, so a single released flick's momentum
      //    tail can't blow through an entire sequence — pacing alone doesn't
      //    prevent that, since real momentum can keep feeding wheel events
      //    well past what a single step should cost.
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

        if (now - lastEventTime > GESTURE_SILENCE_MS) {
          gestureStepCount = 0;
        }
        lastEventTime = now;

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
          gestureStepCount = 0;
          stepIndex = e.deltaY > 0 ? 0 : totalSteps - 1;
          renderStep(stepIndex);
          return;
        }

        if (now - lastStepTime < MIN_STEP_INTERVAL_MS) {
          e.preventDefault();
          return;
        }

        if (gestureStepCount >= MAX_STEPS_PER_GESTURE) {
          e.preventDefault();
          return;
        }

        if (e.deltaY > 0) {
          if (stepIndex < totalSteps - 1) {
            e.preventDefault();
            lastStepTime = now;
            gestureStepCount++;
            goToStep(stepIndex + 1);
          } else {
            releaseForward();
            exitDirection = 1;
            lastStepTime = now;
            gestureStepCount++;
          }
        } else if (e.deltaY < 0) {
          if (stepIndex > 0) {
            e.preventDefault();
            lastStepTime = now;
            gestureStepCount++;
            goToStep(stepIndex - 1);
          } else {
            setEngaged(false);
            exitDirection = -1;
            lastStepTime = now;
            gestureStepCount++;
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

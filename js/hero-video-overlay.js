// Hover/tap overlay for the hero video mockup. Pause freezes the current
// frame and steps through a small set of timestamps computed from the
// video's own duration (no separate frame-sequence assets exist yet — see
// PROJECT_CONTEXT.md). Expand opens a lightbox mirroring the same
// timestamp on a second <video> element sized full-screen.
//
// The hover/click trigger and the corner control pill are both scoped to
// the "screen" rect of the current case's mockup (the monitor/laptop
// glass, not the desk/bezel around it) rather than the whole hero. Each
// case's video is a fixed-resolution render of a photographed device
// mockup with the screen content composited in; SCREEN_RECTS below holds
// the pixel bounding box of that screen area measured against each
// video's native frame (plus, for a perspective-tilted mockup, the exact
// four-corner `quad`). LaptopMockup.computeScreenRect() — already used by
// main.js to place the .hero__screen photo overlay — turns that native
// rect into an on-screen box for the current (cover-fit) container size;
// quadClipPath() turns `quad` into a matching clip-path for the scrim.
(function () {
  'use strict';

  const FRAME_COUNT = 7;

  // Case 1's composite opens on ~3.3s of blank monitor before content
  // appears, then holds the same 3D tab through the next evenly-spaced
  // sample too — so the default 7-way even split wastes its first two
  // stops on a blank frame and a near-duplicate. Dropping those two and
  // resampling the remaining 5 stops across the rest of the clip lines
  // each stop up with one of the product's 5 tabs (3D, Costs, ROI,
  // Energy, Decarbonization), matching CASE_LIGHTBOX_IMAGES below.
  const FRAME_RANGE_OVERRIDES = {
    1: { count: 5, startRatio: 2 / 6 },
    // Case 2's lightbox steps through 5 product screenshots (see
    // CASE_LIGHTBOX_IMAGES below) rather than the default 7-way split, so
    // the hero scrubber's stop count matches the image count 1:1.
    2: { count: 5 },
    // Case 3's default 7 evenly-spaced stops land twice on the same
    // near-blank address screen (2nd stop) and once past the flow's last
    // meaningful step (7th stop) — drop those two rather than resampling,
    // so the remaining 5 stay evenly spaced from the original 7-way split.
    3: { exclude: [1, 6] }
  };

  // Measured by eye against a native-resolution frame grab of each video —
  // see the case's mockup device (desktop monitor for case 1, laptop for
  // case 2). Re-measure if these video assets are replaced.
  //
  // Case 1's video is a perspective-warped composite (see composite.py in
  // the scratchpad that produced configurator-desktop-composite.mp4): the
  // screen content is warped onto a tilted monitor photo, not axis-aligned,
  // so `screen` alone (an axis-aligned box) would let the hitbox/scrim
  // overlap the bezel on the narrow side of the tilt and gap it on the
  // wide side. `quad` carries the same four corner points used for that
  // warp — [TL, BL, BR, TR] in the composite's native 2764x1504 frame — so
  // the scrim can be clipped to the exact trapezoid via quadClipPath().
  //
  // Case 3's laptop mockup keeps the real photo as the hero background,
  // with just the screen-shaped slice of a perspective-warped video
  // overlaid on top (see SCREEN_VIDEO_ONBOARDING / .hero__screen-video in
  // main.js) rather than a full-bleed video — but that composite video's
  // own full frame also contains a re-encoded copy of the desk/bezel (see
  // that constant's comment), so it's a legitimate full-scene clip in its
  // own right and this overlay's scrub/expand controls apply to it the
  // same way as cases 1-2. `screen` here is just the bounding box of
  // SCREEN_VIDEO_ONBOARDING's `quad`; main.js dispatches
  // 'hero:active-video-changed' pointing at #hero-screen-video whenever
  // this case's video is (re)loaded, same event cases 1-2 use for their
  // hero-video-a/b crossfade.
  const SCREEN_RECTS = {
    1: {
      imageWidth: 2764, imageHeight: 1504,
      screen: { left: 584, top: 138, right: 2292, bottom: 1164 },
      quad: [[584, 138], [602, 1164], [2292, 1112], [2262, 208]]
    },
    2: { imageWidth: 3390, imageHeight: 1856, screen: { left: 936, top: 382, right: 2454, bottom: 1224 } },
    3: {
      imageWidth: 2400, imageHeight: 1260,
      screen: { left: 576, top: 212, right: 1608, bottom: 838 },
      quad: [[576, 232], [614, 838], [1608, 776], [1568, 212]]
    }
  };

  // Case 3's hero photo + screen-video overlay are both rendered at
  // LAPTOP_ZOOM (see main.js) rather than the 1x cover-fit cases 1-2 use
  // for their full-bleed video, so this overlay's hitbox/scrim need the
  // same zoom to stay registered with the visible (zoomed) screen.
  const HITBOX_ZOOM_BY_CASE = { 3: (typeof LAPTOP_ZOOM !== 'undefined' ? LAPTOP_ZOOM : 1.1) };

  const hero = document.querySelector('.hero');
  const hitbox = document.getElementById('hero-video-hitbox');
  const scrim = hitbox ? hitbox.querySelector('.hero-video__scrim') : null;
  const grade = hitbox ? hitbox.querySelector('.hero-video__grade') : null;
  // The hero shows two stacked <video> elements that crossfade between
  // cases (see main.js); `video` always points at whichever one is
  // currently on top, and is repointed via 'hero:active-video-changed'.
  let video = document.getElementById('hero-video-a');
  const playPauseBtn = document.getElementById('hero-video-playpause');
  const expandBtn = document.getElementById('hero-video-expand');
  const prevBtn = document.getElementById('hero-video-prev');
  const nextBtn = document.getElementById('hero-video-next');
  const indicator = document.getElementById('hero-video-indicator');

  const lightbox = document.getElementById('video-lightbox');
  const lightboxBackdrop = document.getElementById('video-lightbox-backdrop');
  const lightboxVideo = document.getElementById('video-lightbox-video');
  const lightboxImage = document.getElementById('video-lightbox-image');
  const lightboxClose = document.getElementById('video-lightbox-close');
  const lightboxPrev = document.getElementById('video-lightbox-prev');
  const lightboxNext = document.getElementById('video-lightbox-next');
  const lightboxIndicator = document.getElementById('video-lightbox-indicator');

  // Case 1 (Configurator) has real product screenshots for its key tabs, so
  // the expanded lightbox steps through those instead of scrubbing the
  // hero's warped-monitor composite video frame by frame. Other cases have
  // no such screenshot set yet, so they keep the video-timestamp behavior.
  const CASE_LIGHTBOX_IMAGES = {
    1: [
      { src: 'assets/2 - Configurator - 3D.jpg', alt: '3D building view in the Configurator, with renovation measures selectable on the model' },
      { src: 'assets/3 - Configurator - Costs.png', alt: 'Cost breakdown tab of the Configurator, with transparent per-measure pricing' },
      { src: 'assets/4 - Configurator - ROI - Graph.png', alt: 'ROI graph tab of the Configurator, plotting return on investment for the selected scenario' },
      { src: 'assets/5 - Configurator - Energy.png', alt: 'Energy tab of the Configurator, showing energy performance data for the scenario' },
      { src: 'assets/66 - Configurator - Decarbonization.png', alt: 'Decarbonization tab of the Configurator, showing the property\'s decarbonization path' }
    ],
    2: [
      { src: 'assets/1- Portfolio Overview.png', alt: 'Portfolio overview screen, showing KPIs and health signals across all properties' },
      { src: 'assets/2.1 - Portfolio Insights.png', alt: 'Portfolio insights screen, surfacing performance signals across the portfolio' },
      { src: 'assets/2.2Strategy.png', alt: 'Strategy screen, comparing renovation scenarios across the portfolio' },
      { src: 'assets/3.1 - Portfolio Insights.png', alt: 'Portfolio insights screen, drilled into property-level detail' },
      { src: 'assets/3.2 - Portfolio Insights.png', alt: 'Portfolio insights screen, continued property-level detail' }
    ],
    3: [
      { src: 'assets/Property address_filled.png', alt: 'Property address step of the onboarding flow, filled in' },
      { src: 'assets/2Gebäudeart.png', alt: 'Building type (Gebäudeart) step of the onboarding flow, filled in' },
      { src: 'assets/3Property details.png', alt: 'Property details step of the onboarding flow, filled in' },
      { src: 'assets/4Dimensions.png', alt: 'Dimensions step of the onboarding flow' },
      { src: 'assets/5Home.png', alt: 'Resulting dashboard after completing the onboarding flow' }
    ]
  };

  if (!hero || !hitbox || !video || !playPauseBtn) return;

  const playIcon = playPauseBtn.querySelector('.hero-video__icon--play');
  const pauseIcon = playPauseBtn.querySelector('.hero-video__icon--pause');

  let frameTimestamps = [];
  let currentFrame = 0;
  let isFramePaused = false;
  let lightboxMode = 'video';
  let lightboxImageIndex = 0;
  let activeCaseId = (document.querySelector('.case-tab.is-active') || {}).dataset
    ? document.querySelector('.case-tab.is-active').dataset.case
    : '1';

  function positionHitbox() {
    // Case 2 (Portfolio Overview) sits against a warmer golden-amber scene
    // than the Configurator's default grade — see .hero-video__grade--portfolio
    // and .hero.is-portfolio-grade in styles.css for the recalibrated recipe.
    const isPortfolioCase = activeCaseId === '2';
    hero.classList.toggle('is-portfolio-grade', isPortfolioCase);
    if (grade) grade.classList.toggle('hero-video__grade--portfolio', isPortfolioCase);

    const config = SCREEN_RECTS[activeCaseId];
    if (!config) {
      hitbox.style.display = 'none';
      return;
    }
    hitbox.style.display = '';
    const rect = LaptopMockup.computeScreenRect(hero, config, HITBOX_ZOOM_BY_CASE[activeCaseId] || 1);
    hitbox.style.left = rect.left + 'px';
    hitbox.style.top = rect.top + 'px';
    hitbox.style.width = rect.width + 'px';
    hitbox.style.height = rect.height + 'px';
    // The hitbox itself stays an axis-aligned bounding box (just a hover
    // trigger area — a slightly oversized hover zone near a tilted screen's
    // narrow corners is harmless). Only the visible scrim gets clipped to
    // the exact trapezoid, so the dark tint never spills onto the bezel;
    // the corner control pill is left unclipped, anchored to the bounding
    // box's corner as before. The color-grade overlay needs the exact same
    // registration as the scrim, so it gets the same clip-path.
    const clipPath = LaptopMockup.quadClipPath(config);
    if (scrim) scrim.style.clipPath = clipPath;
    if (grade) grade.style.clipPath = clipPath;
  }

  positionHitbox();

  let resizeRaf = null;
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      positionHitbox();
    });
  });

  function computeFrameTimestamps() {
    const duration = video.duration;
    const override = FRAME_RANGE_OVERRIDES[activeCaseId];
    const count = override && override.count ? override.count : FRAME_COUNT;
    const startRatio = override && override.startRatio ? override.startRatio : 0;
    frameTimestamps = [];
    if (!duration || !isFinite(duration)) {
      for (let i = 0; i < count; i++) frameTimestamps.push(0);
    } else {
      const start = duration * startRatio;
      for (let i = 0; i < count; i++) {
        frameTimestamps.push(count === 1 ? start : start + ((duration - start) * i) / (count - 1));
      }
    }
    if (override && override.exclude) {
      frameTimestamps = frameTimestamps.filter((_, i) => !override.exclude.includes(i));
    }
  }

  // Repoints `video` (and everything derived from it) at whichever hero
  // <video> is currently on top after a crossfade — see main.js's
  // 'hero:active-video-changed' dispatch. By the time that fires, main.js
  // has already waited for the new clip's 'loadeddata', so its metadata is
  // available synchronously; no need to wait on the event again here.
  function bindVideo(newVideo) {
    video = newVideo;
    if (video.readyState >= 1) {
      computeFrameTimestamps();
    } else {
      video.addEventListener('loadedmetadata', computeFrameTimestamps, { once: true });
    }
    currentFrame = 0;
    isFramePaused = false;
    hero.classList.remove('is-video-paused');
    setPlayPauseIcon(false);
    updateIndicator();
    updateBoundaryState();
  }

  document.addEventListener('hero:active-video-changed', (e) => {
    if (e.detail && e.detail.video) bindVideo(e.detail.video);
  });

  if (video.readyState >= 1) computeFrameTimestamps();
  else video.addEventListener('loadedmetadata', computeFrameTimestamps, { once: true });

  function frameIndexForTime(time) {
    if (!frameTimestamps.length) return 0;
    let closest = 0;
    let closestDiff = Infinity;
    for (let i = 0; i < frameTimestamps.length; i++) {
      const diff = Math.abs(frameTimestamps[i] - time);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = i;
      }
    }
    return closest;
  }

  function updateIndicator() {
    const text = (currentFrame + 1) + ' / ' + frameTimestamps.length;
    indicator.textContent = text;
    lightboxIndicator.textContent = text;
  }

  function updateBoundaryState() {
    const atStart = currentFrame <= 0;
    const atEnd = currentFrame >= frameTimestamps.length - 1;
    prevBtn.disabled = atStart;
    lightboxPrev.disabled = atStart;
    nextBtn.disabled = atEnd;
    lightboxNext.disabled = atEnd;
  }

  function setPlayPauseIcon(paused) {
    playIcon.hidden = !paused;
    pauseIcon.hidden = paused;
    playPauseBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  }

  function enterFramePaused() {
    if (!video.paused) video.pause();
    currentFrame = frameIndexForTime(video.currentTime);
    isFramePaused = true;
    hero.classList.add('is-video-paused');
    setPlayPauseIcon(true);
    updateIndicator();
    updateBoundaryState();
  }

  function resetPausedState(shouldPlay) {
    isFramePaused = false;
    hero.classList.remove('is-video-paused');
    setPlayPauseIcon(false);
    if (shouldPlay) video.play().catch(() => {});
  }

  function togglePlayPause() {
    if (isFramePaused) {
      resetPausedState(true);
    } else {
      enterFramePaused();
    }
  }

  function goToFrame(index) {
    if (!frameTimestamps.length) return;
    currentFrame = Math.max(0, Math.min(frameTimestamps.length - 1, index));
    video.currentTime = frameTimestamps[currentFrame];
    updateIndicator();
    updateBoundaryState();
    if (lightbox && !lightbox.hidden) {
      lightboxVideo.currentTime = frameTimestamps[currentFrame];
    }
  }

  function stepFrame(delta) {
    if (!isFramePaused) enterFramePaused();
    goToFrame(currentFrame + delta);
  }

  playPauseBtn.addEventListener('click', togglePlayPause);
  prevBtn.addEventListener('click', () => stepFrame(-1));
  nextBtn.addEventListener('click', () => stepFrame(1));

  function updateLightboxImageNav() {
    const images = CASE_LIGHTBOX_IMAGES[activeCaseId];
    if (!images) return;
    lightboxIndicator.textContent = (lightboxImageIndex + 1) + ' / ' + images.length;
    lightboxPrev.disabled = lightboxImageIndex <= 0;
    lightboxNext.disabled = lightboxImageIndex >= images.length - 1;
  }

  function showLightboxImage(index) {
    const images = CASE_LIGHTBOX_IMAGES[activeCaseId];
    if (!images) return;
    lightboxImageIndex = Math.max(0, Math.min(images.length - 1, index));
    const item = images[lightboxImageIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    updateLightboxImageNav();
  }

  function openLightbox() {
    if (!lightbox) return;
    enterFramePaused();

    const images = CASE_LIGHTBOX_IMAGES[activeCaseId];
    lightbox.classList.toggle('video-lightbox--image', !!images);
    if (images) {
      lightboxMode = 'image';
      lightboxVideo.hidden = true;
      lightboxImage.hidden = false;
      showLightboxImage(currentFrame);
    } else {
      lightboxMode = 'video';
      lightboxImage.hidden = true;
      lightboxVideo.hidden = false;
      const src = video.currentSrc || video.src;
      if (lightboxVideo.getAttribute('src') !== src) {
        lightboxVideo.setAttribute('src', src);
      }
      const seekToCurrentFrame = () => {
        lightboxVideo.currentTime = frameTimestamps[currentFrame];
      };
      if (lightboxVideo.readyState >= 1) {
        seekToCurrentFrame();
      } else {
        lightboxVideo.addEventListener('loadedmetadata', seekToCurrentFrame, { once: true });
      }
    }

    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-visible'));
    document.body.classList.add('lightbox-open');
    lightboxClose.focus();
  }

  function closeLightbox(returnFocus) {
    if (!lightbox || lightbox.hidden) return;
    lightbox.classList.remove('is-visible');
    document.body.classList.remove('lightbox-open');
    setTimeout(() => {
      lightbox.hidden = true;
    }, 200);
    if (returnFocus !== false) expandBtn.focus();
  }

  function lightboxStep(delta) {
    if (lightboxMode === 'image') {
      showLightboxImage(lightboxImageIndex + delta);
    } else {
      stepFrame(delta);
    }
  }

  expandBtn.addEventListener('click', openLightbox);
  lightboxClose.addEventListener('click', () => closeLightbox());
  lightboxBackdrop.addEventListener('click', () => closeLightbox());
  lightboxPrev.addEventListener('click', () => lightboxStep(-1));
  lightboxNext.addEventListener('click', () => lightboxStep(1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxStep(-1);
    if (e.key === 'ArrowRight') lightboxStep(1);
  });

  // main.js's renderCase() already plays/pauses `video` correctly for the
  // case being switched to/from — only clear our own paused-frame state
  // here, don't call video.play() ourselves or we'd override a switch to
  // the photo-only case (2), which renderCase just paused.
  document.addEventListener('onboarding:case-change', (e) => {
    activeCaseId = String(e.detail && e.detail.id);
    positionHitbox();
    closeLightbox(false);
    if (isFramePaused) resetPausedState(false);
  });
})();

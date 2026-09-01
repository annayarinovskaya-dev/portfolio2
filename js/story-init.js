(function () {
  function boot() {
    const heroRoot = document.querySelector('.hero');
    const pinWrapper = document.getElementById('story-pin');
    const mount = document.getElementById('story');
    if (!heroRoot || !pinWrapper || !mount) return;
    if (!window.ScrollStory || !window.LaptopMockup || !window.ONBOARDING_STORY) return;

    const story = window.ScrollStory.create(Object.assign(
      { heroRoot: heroRoot, pinWrapper: pinWrapper, mount: mount },
      window.ONBOARDING_STORY
    ));

    const activeTab = document.querySelector('.case-tab.is-active');
    if (activeTab && activeTab.dataset.case === String(window.ONBOARDING_STORY.activateOn)) {
      story.setup();
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();

// Data for the "Onboarding" case study's ScrollStory continuation.
// Copy adapted from the original case study at
// https://iarinovskaia.com/onboarding-case-study (condensed for the
// pinned-panel format; substance preserved).
//
// A future case study is a new file shaped like this one, passed to
// ScrollStory.create() in js/story-init.js — nothing here is read by the
// component itself except through that config object. `intro` is optional:
// omit it entirely for a case study that skips the teaser beat.
window.ONBOARDING_STORY = {
  // Case-nav tab id (see js/main.js CASES) this story arms itself for.
  activateOn: 3,

  // Same photo + screen-rect pair the hero already uses for this case's
  // static screen (js/main.js CASES[3].screenshot), so the pinned laptop
  // and the hero's laptop are pixel-aligned during the handoff.
  laptop: {
    photo: 'assets/case-3-onboarding.jpg',
    imageWidth: 1401,
    imageHeight: 768,
    screen: { left: 417, top: 184, right: 995, bottom: 570 }
  },

  // Every screen referenced below (by `screenshot` id) from the full
  // sections is drawn from this one pool.
  screenshots: [
    { id: 'address', src: 'assets/story/onboarding-01-address.png', alt: 'Property address entry step of the onboarding flow' },
    { id: 'type', src: 'assets/story/onboarding-02-property-type.png', alt: 'Property type selection step' },
    { id: 'details', src: 'assets/story/onboarding-03-property-details.png', alt: 'Property details form step' },
    { id: 'energy-insight', src: 'assets/Property detail page.png', alt: 'Property detail page showing the first energy insight' },
    { id: 'empty-dashboard', src: 'assets/story/home-user.png', alt: 'The empty dashboard new users landed on before the redesign' }
  ],

  // Full-paragraph reveals, one at a time, laptop pinned throughout — the
  // "now actually read" pace that follows the teaser. Pacing math in
  // scroll-story.js (SECTION_VH_PER_SECTION) is driven purely by
  // sections.length, so this list can grow or shrink without other changes.
  //
  // A second beat used to close this pinned run, since retired:
  //
  // - 'outcome' (number '02', kicker 'Outcome'): heading "Four decisions
  //   that shaped the flow", body "Turning that goal into a flow meant
  //   rethinking onboarding end to end — from the first screen to the
  //   dashboard it hands off to.", and a callout list of the four
  //   decisions ("Action-driven onboarding — action replaces explanation",
  //   "Simplified property creation — reduced to only what's essential",
  //   "Flexible and non-blocking — save as draft, skip, continue later",
  //   "Onboarding extends into the dashboard, not just the setup flow").
  //   Earmarked as the intro/overview for the Approach section of the full
  //   #case-detail write-up, ahead of the four decision blocks expanded in
  //   detail there.
  sections: [
    {
      // No `number` field — renders without a step badge (see captionHTML
      // / the story__panel-number guard in scroll-story.js).
      id: 'problem', kicker: 'Problem', screenshot: 'empty-dashboard',
      heading: '',
      body: 'No guidance, no starting point — and no way to know a property had to exist first. Every new signup risked leaving before finding any value.',
      callout: null
    },
    {
      id: 'outcome-hook', kicker: 'Outcome', screenshot: 'energy-insight',
      heading: 'From empty dashboard to first insight.',
      plainHeading: true,
      body: '',
      callout: null
    }
  ],

  closing: { text: "Here's how we got there", href: '#case-detail' }
};

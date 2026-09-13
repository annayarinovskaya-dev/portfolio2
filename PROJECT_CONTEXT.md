# Project Context

## 1. Project Overview

- A personal portfolio website for **Anna Iarinovskaia**, a digital product designer based in Berlin. It presents three case studies (a "Configurator", a "Portfolio Overview", and an "Onboarding" flow) built for a B2B SaaS / climate-tech (property energy management) product, plus a short "About" section.
- Purpose: showcase design case studies with a cinematic, laptop-mockup-driven hero and detailed scroll-based write-ups for each case.
- Current stage: **in-progress / content still being drafted**. The visual shell, navigation, and case-detail layout are built and working. Several case studies have placeholder copy ("Placeholder headline about the measured outcome", "—%" metrics, a missing-screenshot slot in case 3). A previously-built scroll-driven pinned storytelling sequence (`js/scroll-story.js`) is implemented but currently **not wired up** to any content (see §9/§10).

## 2. Tech Stack

- **Framework:** None — plain static HTML/CSS/vanilla JS. No build step, no bundler, no package.json/npm.
- **Language:** HTML5, CSS3 (custom properties), ES5/ES6 vanilla JavaScript (IIFEs, no modules/imports).
- **Styling:** Hand-written CSS using a custom design-token system (see `css/styles.css` `:root`), BEM-ish class naming (`case-detail__meta-col--scope`, `story__panel-block`, etc.).
- **Fonts:** Google Fonts — `DM Sans` (400/500/600/700) and `Marcellus` (serif), loaded via `<link>` in `index.html`.
- **Animation:** No animation library — all animation is CSS transitions/`prefers-reduced-motion` handling plus hand-rolled JS (`IntersectionObserver` for scroll reveals, a custom wheel-capture state machine for the pinned story sequence).
- **Build/dev tools:** None required to run. **To preview: run `python3 -m http.server 8791` from the repo root, then open `http://localhost:8791`** (matches `.claude/launch.json`'s configured launch command). Opening `index.html` directly via `file://` will mostly render, but the hero's autoplay `<video>` and any relative-path fetches are more reliable served over HTTP — prefer the local server when checking a change in-browser.
- **Deployment:** Unknown. `git remote -v` points to `https://github.com/annayarinovskaya-dev/portfolio2.git`, but there is no CI/deploy config in the repo (no GitHub Actions workflow, `netlify.toml`, `vercel.json`, or `CNAME`) — how (or whether) this site is actually published is not determinable from the codebase.
- **Testing/QA tooling:** `pixel-match/` — Python + Playwright scripts (`shot_default.py`, `shot_case3.py`) that screenshot the live page for pixel-diffing against `pixel-match/target.png`, with iteration folders (`iter-1` … `iter-8`) of past diff runs. Not part of the app itself, used for visual QA during development.
- **Asset-generation tooling:** `scripts/regenerate-onboarding-composite.py` — one-off maintenance script (OpenCV + ffmpeg, run by hand, never invoked by the site) that (re)builds `assets/onboarding-desktop-composite.mp4` from `assets/onboarding-flow.mp4`. See §10 for why this exists and what to do if the source video changes.
- **Other:** `.agents/skills/animate/` is a Claude Code skill bundle (reference docs/examples for animation patterns), not project source.

## 3. Project Structure

```
index.html              Single-page document — all markup for hero, about, and all 3 case studies lives here
css/
  styles.css             Design tokens (:root), base layout, hero, side-nav, about section, case-detail write-up styling, responsive rules
  scroll-story.css        Styling for the pinned scroll-story overlay system (teaser/panel/progress-trail/mobile-stacked variants) — layered on top of styles.css tokens
js/
  main.js                 Case-switching logic (CASES data + tab clicks), About panel toggle, case-detail section toggling, hero laptop-screen positioning
  scroll-story.js          Generic ScrollStory.create() engine: wheel-capture pinned stepper + page-level progress trail + stacked/mobile fallback. Currently unused — see §9.
  laptop-mockup.js         Shared geometry helpers (computeScreenRect, screenRectPercent) mapping a screenshot onto a laptop-photo's screen area
assets/                  Images/videos referenced by index.html (hero photos/videos, about portrait, per-case story screenshots in assets/story/)
pixel-match/             Playwright screenshot + visual-diff QA scripts and past iteration outputs (dev tooling, not shipped)
.claude/launch.json      Dev server launch config (python3 http.server on port 8791)
skills-lock.json         Claude Code skills lockfile
```

No `src/`, no framework config, no routing config — everything is these few files.

## 4. Architecture

- **Entry point:** `index.html` is the only page (true single-page site, no client-side router — "navigation" is CSS/JS state toggling within one document, not URL-driven routing).
- **Load order:** `laptop-mockup.js` → `main.js` → `scroll-story.js` (script tags at end of `<body>`), each an IIFE/global-attaching script (`window.LaptopMockup`, `window.ScrollStory`), no module system.
- **Sections in document order:**
  1. `.intro` (fixed name/role, top-right) + `.side-nav` (fixed "About" tab, top-left) — persistent chrome over everything.
  2. `#story-pin > .hero` — full-viewport hero: background video/photo per active case, an optional "laptop screen" overlay image cropped to the photo's laptop bezel, and `.case-card` (case number tabs 01/02/03 + title/description, bottom-left).
  3. `#about` — fixed, full-screen overlay panel (off-canvas via opacity/transform), toggled by the side-nav tab.
  4. `#story` (`data-scroll-story`) — mount point for the pinned scroll-story sequence. Currently empty/inert (no config wired in; see §9).
  5. `#case-detail-1/2/3` (`.case-detail`) — the three full case-study write-ups, each in normal document flow below the hero. Only the one matching the active case tab has `.is-active` (`display: block`); the others are `display: none`.
- **State/data model:** `main.js` holds a `CASES` object keyed `1|2|3` with `{video|photo, tags, title, desc}` driving the hero. Clicking a `.case-tab` calls `renderCase(id)` (swaps hero media/copy) and dispatches a custom `onboarding:case-change` event with `{id}`, which `initCaseDetailToggle()` listens for to show/hide the matching `.case-detail-N` section. `scroll-story.js`'s `ScrollStory` instances (when wired) also key off this same event via their `activateOn` config.
- **Relationship between components:** `laptop-mockup.js`'s geometry functions are shared by both `main.js` (positioning the hero's static `.hero__screen` overlay) and `scroll-story.js` (positioning the pinned overlay's `.story__screen`) — a single source of truth for "where is the laptop's screen area in this photo."

## 5. Design System

All tokens live in `css/styles.css` `:root` (commented "ORYZO design system"), reused by `scroll-story.css`.

**Colors**
- `--color-warm-cream: #ffedd7` — primary light/cream (body default text color)
- `--color-walnut-shadow: #100904` — near-black (body background, dark ink text on light sections)
- `--color-bark-brown: #7c1e1e` / `--color-brand-red: #7c1e1e` — primary brand red
- `--color-cork-border: #4a1f1f` — dark reddish-brown, used for most case-detail body text
- `--color-driftwood: #c99494` — dusty pink hover accent
- `--color-ember-accent: #ffcece`
- `--color-case-accent: #7d0000` — accent used for bullets/quote-rules/decision headings in case-detail
- `--color-off-white: #ffffff` — used for hero-overlay text and `.case-detail` background
- Glass-surface tokens (`--glass-bg/border/hover/blur/text-shadow`) exist but are not obviously consumed by current CSS — verify before relying on them.

**Typography**
- `--font-serif: 'Marcellus', Georgia, ...` — display/headline font (case titles, section labels, about heading, metric numbers)
- `--font-display: 'DM Sans', ...` — body/UI font (default)
- `--font-caption: Arial, system-ui, sans-serif` — declared but not clearly used in current CSS
- Weight tokens: `--font-weight-regular: 400`, `-medium: 500`, `-bold: 700`
- Size/leading tokens (`--text-display/-heading/-heading-sm/-subheading/-body`, matching `--leading-*`) are defined but much of the actual case-detail copy uses inline `clamp()` values rather than these tokens — the token set and the applied styles have drifted apart; check actual selectors, not just tokens, before assuming a size.

**Spacing:** `--spacing-6` through `--spacing-68` (plus `--card-padding: 24px`, `--element-gap: 18px`) — a fixed px scale, not a multiplier system.

**Radius:** All radius tokens (`--radius-cards/-inputs/-buttons-pill/-buttons-outlined/-full`) are `0px` — the design is intentionally hard-edged/square everywhere (case-nav tabs, images, etc. are all square-cornered).

**Shadows:** No shadow tokens; `--glass-text-shadow` is the only shadow-like token, of unclear current use.

**Breakpoints:** Two: `max-width: 980px` (main mobile breakpoint — hero, nav, about, case-detail all restack) and `max-width: 560px` (further shrinks `.intro` type).

**Reusable UI patterns**
- `.case-detail__label` / `.case-detail__row` — a repeating 3-column grid layout (`label | content | content`) used for every case-detail sub-section (Context, Goal, Approach, Research, Impact, Reflection).
- Vertical rotated-text + line "rail" pattern (`writing-mode: vertical-rl`) reused for `.case-nav__label`, `.story__progress-hint`, `.story__closing-cue-text` — a consistent scroll/navigation wayfinding language.
- `.case-detail__decision-image--missing` — a dashed-border placeholder pattern for not-yet-available case screenshots.

## 6. Important Components

(All are plain JS functions/modules, not framework components.)

- **`renderCase(id)`** (`js/main.js`) — swaps the hero's video/photo/title/description and positions the screen overlay for the given case id; central to hero state.
- **`layoutScreen()` / `positionScreen()`** (`js/main.js`) — manage the `.hero__screen` overlay image that sits "inside" the laptop photo, using `LaptopMockup.computeScreenRect()`.
- **`initCaseNav()`** — wires the 01/02/03 tab clicks to `renderCase` + the `onboarding:case-change` event.
- **`initAbout()`** — toggles the fullscreen About panel (`body.about-open`), including Escape-to-close.
- **`initCaseDetailToggle()`** — shows/hides the matching `.case-detail-N` on case change.
- **`LaptopMockup.computeScreenRect(container, config, zoom)`** (`js/laptop-mockup.js`) — cover-fit math mapping a screenshot onto a laptop photo's screen bezel for a viewport-filling container.
- **`LaptopMockup.screenRectPercent(config)`** — the same mapping as simple percentages, for the mobile/stacked (natural-size image) layout.
- **`ScrollStory.create(config)`** (`js/scroll-story.js`) — generic engine for a pinned, wheel-captured, multi-step scroll narrative (intro teaser lines → numbered panel sections → closing cue), with an automatic stacked/mobile fallback and a page-level progress trail. Data-driven and currently case-agnostic, but has no active config/data feeding it (see §9).

## 7. Pages / Sections

Single page, sectioned as described in §4:

- **Hero / case switcher** — working. Cases 1 and 3 use looping background video (`assets/new project_1920_1080.mp4`, `assets/onboarding-flow.mp4`); case 2 uses a static photo (`assets/case-2-portfolio-dashboard.jpg`). None of the three currently set a `screenshot` on the `CASES` data, so the `.hero__screen` laptop-overlay path in `renderCase`/`layoutScreen` is present but effectively idle for all three.
- **About** — working. Static bio panel with portrait, lead paragraph, email/LinkedIn links.
- **`#story`** — present in markup, styled, but empty/inert — no `ScrollStory.create()` call currently exists anywhere in the codebase.
- **Case 1 — Configurator** — most complete write-up, restructured (2026-09-03) into a Product Design narrative: Overview → Problem (with an annotated static-report visual) → Research & Insights (quotes + "what was working/still missing") → Design Evolution (V0/V1/V2 with research→design-decision captions) → Key Design Decisions (new 4-card section, close-up crops of existing screenshots) → Impact → Reflection. No Goal section (its real content was folded into Research; its placeholder principle line was dropped). Uses only existing assets/copy — no invented metrics.
- **Case 2 — Property Portfolio Management** — restructured (2026-09-03) into a Product Design narrative: Problem & Context → Hypothesis & Constraints (quote-led, deliberately minimal) → Exploration (narrowing from Finance/Energy/Construction to Current State + Strategy, illustrated by repurposing the compare-item pattern) → Final Solution (4 connected layers: Portfolio Health → Strategy → Roadmap → Configurator) → Before/After (two-image compare + bullet lists) → Validation (8 user testing sessions) → Reflection. The old placeholder Impact section ("Placeholder headline...", "—%"/"—x" metrics) was removed — no invented metrics exist anywhere in this case. Hero title updated from "Portfolio Overview" to "Property Portfolio Management" in `main.js`. Uses only existing assets: `assets/case-2-portfolio-dashboard.jpg` (the plain "Portfolios" list) as the Before/Problem visual, and the four `assets/story/portfolio-0{1..4}-*.png` screenshots for the Final Solution layers — no FigJam/architecture or Notion research-tracking asset exists in the repo, so the Exploration and Validation sections describe those artifacts in text only rather than inventing a visual.
- **Case 3 — Onboarding** — Context/Goal/Approach(4 steps, one step has a missing-screenshot placeholder)/Impact/Reflection; no Research section; Impact and Reflection are placeholder copy.

## 8. Animations & Interactions

- **Hero media crossfade:** `.hero__photo`/`.hero__video` opacity/transform transitions on case switch (`transition: opacity .25s ease, transform .4s ease` in `styles.css`).
- **About panel:** `opacity`/`transform: translateY()`/`visibility` transition (0.4s) driven by `body.about-open`.
- **Case-detail write-up:** `IntersectionObserver`-driven `.is-visible` reveal classes (via `scroll-story.js`'s `observeReveal`) for `story__flow-section`/`story__mobile-block`/etc. — **note:** this reveal mechanism lives in `scroll-story.js` and is set up only inside `ScrollStory.create()`'s `setupStacked`/`setupPinned`, which is never invoked (§9) — currently no scroll-reveal animation runs anywhere on the page; case-detail content is simply always visible.
- **Progress trail (`initProgressTrail` in `scroll-story.js`):** IS self-initializing at load (`initProgressTrail()` runs unconditionally at the bottom of the IIFE, independent of `ScrollStory.create`) — draws a fixed vertical rail + moving marker (`.story__progress`) tracking scroll position through `#case-detail`, switching color once the light `.case-detail` background reaches its midpoint.
- **Pinned wheel-capture stepper:** fully implemented, extensively commented state machine in `scroll-story.js` (`setupPinned()`/`onWheel()`) for stepping through an intro-teaser + numbered-panel sequence by intercepting wheel events over a 100vh pin — **not currently active** since nothing calls `ScrollStory.create()`. See the large header comment at the top of `js/scroll-story.js` before touching this logic; it documents a precise transition table (9 states) that's easy to break with an "obvious" small change.
- **Pin-and-cover hero handoff** (`css/scroll-story.css` `.story-pin`/`.hero`/`.case-detail` rules): a *CSS-only*, always-on effect — the sticky hero holds for 200vh while `#case-detail` rises via negative `margin-top` to cover it. This part works independent of `ScrollStory`/JS.
- **Reduced motion:** `prefers-reduced-motion: reduce` is respected in `scroll-story.js` (`prefersReducedMotion()`) and has dedicated CSS overrides.
- **Hover states:** `.case-tab:hover`, `.side-tab:hover` — simple color/background transitions (0.2–0.3s ease).

## 9. Current Implementation

- Working: hero case-switching (video/photo + copy), About panel, case-detail section toggling and full 3-column layout system, responsive collapse at 980px/560px, page-level scroll progress trail, CSS-only pin-and-cover hero→case-detail handoff.
- **Built but disconnected:** the entire `ScrollStory` pinned-narrative engine (`js/scroll-story.js` + `css/scroll-story.css` pin-overlay rules) is fully implemented and was clearly working for an "onboarding" case study previously — per working-tree `git status`, `js/data/onboarding-story.js` (the content config) and `js/story-init.js` (the file that called `ScrollStory.create(...)`) have been **deleted** in the current uncommitted working tree, and nothing has replaced that wiring. `#story` (`data-scroll-story`) is now an inert empty `<section>`.
- **Concrete clue for restoring it:** `assets/story/home-user.png` and `assets/story/onboarding-02-property-type.png` exist on disk but are referenced by nothing in `index.html` or `js/main.js` — they're almost certainly screenshots the deleted `js/data/onboarding-story.js` config pointed at. If asked to rebuild the onboarding scroll-story, start by checking whether these two images (plus the already-referenced `onboarding-01/03/04-*.png`) map onto its steps.
- The repo has only one commit (`9cbaea0 Initial commit of portfolio2 project`); everything currently on disk beyond that commit is **uncommitted working-tree changes**, including new asset files (case-study screenshots/videos) and the modifications/deletions above.

## 10. Known Issues

- **`assets/onboarding-desktop-composite.mp4` must be regenerated, not hand-edited, if `assets/onboarding-flow.mp4` ever changes.** `onboarding-flow.mp4` is not a flat screen recording — it's already a rendered laptop-mockup video (own bezel/keyboard/desk/plant baked in, with the actual UI occupying only an inner sub-rectangle of its frame). The composite is built by cropping out just that inner UI rectangle and perspective-warping it onto `SCREEN_VIDEO_ONBOARDING.quad` (`js/main.js`), so the result lines up with the real laptop photo behind it (`assets/photo_5829314581652770763_y.jpg`) without producing a laptop-inside-a-laptop. Run `python3 scripts/regenerate-onboarding-composite.py` to rebuild it; run it with `--detect` first if the source video has changed, since the crop rectangle (`INNER_RECT`) is hardcoded against the *current* `onboarding-flow.mp4` and has to be re-measured for a new take (see the script's docstring). This isn't automated or validated at render time — nothing will warn you if the crop goes stale, so re-check by eye (sample a few frames, including any transitions/modals, from the regenerated composite) after running it.
- `#story` / `ScrollStory` is orphaned: no code currently calls `ScrollStory.create()`. If a future session is asked to "fix the scroll story" or "bring back the onboarding animation," the fix is likely to re-author a config (matching the old `js/data/onboarding-story.js` shape referenced in `scroll-story.js`'s header comment) and a small init script, not to change the engine itself.
- Placeholder content remains in Case 3 Impact/Reflection, and one Case 3 Approach step has a `case-detail__decision-image--missing` placeholder block instead of a real screenshot. (Case 1's former placeholder Goal principle and Case 2's former placeholder Impact section were both resolved on 2026-09-03 — see §7.)
- `css/scroll-story.css` references a `.hero__vignette` class in a comment (line ~477) that does not exist anywhere in the current CSS — stale comment from a removed feature; don't assume the vignette exists when reading that comment.
- Several design tokens (`--font-caption`, `--glass-*`, most `--text-*`/`--leading-*` size tokens) are declared in `:root` but not obviously referenced by current selectors — actual applied sizes mostly use inline `clamp()`. Don't assume a token is live just because it's declared.
- No `screenshot` is set on any entry in `main.js`'s `CASES` object, so the shared `.hero__screen` laptop-overlay code path (`layoutScreen`/`positionScreen`) is currently always idle — worth confirming intent before adding/removing that code.
- Large new binary assets (multiple MP4s, PNGs/JPGs) are currently untracked in git (`??` in `git status`) — flag before running any git operations that assume a clean working tree. There is also **no `.gitignore`** in the repo, so nothing (including `pixel-match/iter-*/` QA screenshot dumps) is currently excluded from being accidentally staged.
- `assets/` has several files not referenced anywhere in `index.html` or `js/main.js`: `ChatGPT Image 28. Aug. 2026, 15_46_54.png`, `Gemini_Generated_Image_h5wsjhh5wsjhh5ws.jpeg`, `Gemini_Generated_Image_jida9hjida9hjida.jpeg`, `Property detail page.png`, `case-3-onboarding.jpg`, `Configurator-Walkthrough-Elegant.mp4` — likely exploratory/superseded generations rather than active assets, but confirm with the user before deleting any of them. (For the two unused files under `assets/story/`, see the `home-user.png`/`onboarding-02-property-type.png` note in §9 — those look like leftovers from the deleted onboarding scroll-story config specifically, not general cruft.)
- No favicon and no `<meta name="description">` in `index.html`'s `<head>` — only a `<title>` is set. Likely just not done yet rather than intentional, given the placeholder content elsewhere.
- No automated tests beyond the manual Playwright pixel-match screenshot scripts in `pixel-match/` (which compare against a static `target.png`, not a spec).
- No deploy/CI config found (see §2 Deployment) — don't assume a particular hosting target (e.g. GitHub Pages) without asking.

## 11. Important Design Decisions

- **No framework/build step is intentional** — the whole site is static HTML/CSS/vanilla JS by design; don't introduce React/Vue/a bundler/npm without an explicit request.
- **Square corners everywhere** (`--radius-*: 0px`) is a deliberate, site-wide aesthetic choice, not an oversight — preserve it in any new UI.
- **Scroll distance, not event count or time, paces the pinned wheel-capture stepper** (`STEP_DISTANCE_PX` in `scroll-story.js`) — explicitly chosen so trackpad and mouse-wheel input feel equally paced; a `MIN_STEP_INTERVAL_MS` floor exists only as a secondary safety net for high-delta devices, not the primary mechanism. See the large header comment at the top of `scroll-story.js` for the full rationale and 9-state transition table before modifying this.
- **`ScrollStory.create()` was deliberately built generic/data-driven** ("nothing in this file is Onboarding-specific" per its header comment) so any case study can plug in a config — the engine itself should stay case-agnostic; case-specific content belongs in a data file, not in `scroll-story.js`.
- **`releaseForward()` intentionally does NOT restore the hero's default screen/hide the overlay** when exiting the pinned sequence forward (scrolling down past the last step) — doing so would flash the hero back to its first-step screenshot while `#case-detail` is still animating in to cover it. This is a deliberate visual-glitch avoidance, documented in detail in `scroll-story.js` above `releaseForward()` — don't "simplify" it to match `setEngaged(false)`'s behavior used on backward-exit.
- **The pin-and-cover hero→case-detail handoff is pure CSS** (negative margin + sticky), independent of any scroll-story JS, so it keeps working for cases without a pinned narrative (cases 1 and 2 currently have none).
- **Progress trail is page-level and always initialized**, independent of which case is active or whether that case has a `ScrollStory` sequence at all — it tracks plain scroll position through `#case-detail`, not per-case narrative progress, by design.

## 12. Current Priorities

Inferred from placeholder content and the current working-tree state — confirm with the user before acting on these:
1. Decide the fate of the `ScrollStory` pinned-narrative feature for the Onboarding case (case 3): either reintroduce a content config + init call, or finish removing its remaining plumbing (`#story` markup, `scroll-story.css`/`scroll-story.js`) if it's being retired.
2. Fill in placeholder copy/metrics: Case 3 Impact + Reflection sections. (Case 2's placeholder Impact section was resolved 2026-09-03 — see §7.)
3. Supply the missing screenshot for Case 3 Approach step 3 ("Flexible and non-blocking"), currently a dashed placeholder box.
4. Review whether the newly added, currently-untracked media assets in `assets/` (several MP4s, PNGs) are all actually referenced/needed, and commit the intended ones.

## 13. Rules for Future Changes

- Do not introduce a framework, bundler, or npm dependency — this is a deliberately static, dependency-free site (§11).
- Reuse `css/styles.css` design tokens (`--color-*`, `--spacing-*`, `--font-*`) rather than hardcoding new values; keep the `--radius-*: 0` square-corner language everywhere.
- Reuse the existing `.case-detail__row` 3-column label/content grid pattern for any new case-detail sub-section rather than inventing a new layout.
- Before touching `js/scroll-story.js`'s `onWheel()`/`setupPinned()`/`setEngaged()`/`releaseForward()`, read the state-machine comment block at the top of the file in full — it's intentionally detailed because this logic has subtle, previously-debugged edge cases.
- Don't assume `#story` / `ScrollStory` is dead code to delete, and don't assume it's "just not hooked up yet" to wire back in blindly — its intended current state is ambiguous (§9/§10); ask the user before changing it either way.
- Preserve the two existing breakpoints (980px, 560px) and test both the pinned-desktop and stacked-mobile/reduced-motion code paths when touching `scroll-story.js`/`scroll-story.css`.
- Preserve the `CASES` object in `main.js` and the `onboarding:case-change` event contract — `initCaseDetailToggle()` and any `ScrollStory` instance both key off it; changing the event name/shape breaks both.
- Don't hand-edit `pixel-match/iter-*` output folders — they're generated QA artifacts from Playwright screenshot runs, not source.
- When editing case-study copy, keep the existing per-case structure (Timeline/Scope/Team meta block → Context → Goal → Approach → [Research] → Impact → Reflection) — sections vary slightly per case (e.g., case 3 has no Research section) but the grid/heading patterns should stay consistent.

## 14. UX / Visual Intent

- **Overall visual direction:** cinematic, editorial, photography/video-led — the hero is a nearly full-bleed laptop-in-use photo/video with minimal chrome (thin white type, hairline borders, no drop shadows, no rounded corners). Case studies read like a design-portfolio magazine spread: large serif (`Marcellus`) headlines, generous whitespace, sans-serif (`DM Sans`) body copy.
- **Layout principles:** heavy use of a 3-column grid for case-detail sections keeps a strict left-label / right-content rhythm throughout every case write-up — consistency across cases matters more than per-case customization. Fixed-position chrome (`.intro`, `.side-nav`) stays anchored top-right/top-left across all states (hero, about, case-detail) so wayfinding never disappears.
- **Interaction principles:** navigation is minimal-click — one tab click switches the entire hero case, one tab click opens/closes About; the deep case write-ups are reached by scrolling, not clicking, keeping "quick browse" (hero) and "deep read" (case-detail) as two distinct, purposeful modes.
- **How animations should feel:** understated and physical rather than showy — opacity/translateY fades (0.3–0.6s ease) for reveals, no bounce/spring easing anywhere in the current CSS, no parallax beyond the sticky pin-and-cover handoff. The one deliberately elaborate interaction (the wheel-capture pinned stepper) is designed to feel like *paced, physical scrolling through a deck*, explicitly tuned by scroll distance rather than snap/discrete triggers — preserve that "distance-paced" feel over anything snappier if this feature is revived.
- **Static vs. interactive:** `.intro`/`.side-nav` chrome and the progress rail are always-static wayfinding; the hero photo/video, case tabs, and (when active) the pinned story overlay are the interactive/animated surfaces. Case-detail body content is currently static (no active scroll-reveal, see §8) though the CSS/JS scaffolding for reveal-on-scroll exists and was clearly intended.
- **Storytelling principles:** each case follows the same narrative arc — Context (problem) → Goal (what mattered + a pull-quote-style guiding principle) → Approach (numbered, screenshot-illustrated decisions) → Research (validating quotes/findings) → Impact (outcome) → Reflection (retrospective takeaway) — a consistent "why → what → how it was validated → what happened → what was learned" structure that should be preserved when writing new case content, even for cases missing a step (e.g., case 3 has no Research).
- **Specific intentional details to preserve:** the vertical rotated-text "rail" wayfinding language (case-nav label, progress-trail hint, closing cue) appearing in the same visual position/style at multiple points in the flow; the numbered ("01.", "02."...) framing of Approach decisions; the deep red accent (`--color-case-accent`) used consistently for quote rules, bullet marks, and decision headings as the one "designer's voice" accent color against otherwise black/white/cream case-detail pages.

## 15. How to Work on This Project

- Before changing anything, inspect the existing implementation and reuse existing patterns/components where possible — read the relevant section(s) of this file, then the actual CSS/JS/markup, before writing new code.
- Do not rewrite or refactor working code unless there is a clear reason. If a refactor seems warranted, say why and confirm before doing it — don't fold it silently into an unrelated change.
- Prefer small, targeted changes over large architectural changes.
- Do not introduce new dependencies (frameworks, bundlers, npm packages, animation libraries) unless they are genuinely necessary — this project is deliberately dependency-free (§11).
- Preserve the existing visual language, spacing, typography, interactions, and animation behavior. Use the tokens in `css/styles.css` `:root` rather than hardcoding new values, and match existing timing/easing (§8, §14) for anything new.
- When implementing a visual change, check how it affects the rest of the page and responsive layouts — this is a single `index.html` with shared fixed chrome (`.intro`, `.side-nav`) across every state, two breakpoints (980px, 560px), and a reduced-motion path; verify all of these still work, not just the default desktop view.
- Before creating a new component, check whether an existing component can be extended or reused — e.g. the `.case-detail__row` 3-column pattern, the `LaptopMockup` screen-positioning helpers, or the `ScrollStory` engine, rather than building a parallel version of any of them.
- Before deleting files or assets that appear unused, verify that they are truly unnecessary. Do not assume that orphaned assets are safe to delete — several unused files in `assets/` are flagged in §10 as ambiguous (possibly leftovers from the deleted onboarding scroll-story config, possibly just unused generations); confirm with the user before removing any of them.
- When something is ambiguous, inspect the codebase first and ask me rather than making a major assumption — this applies especially to the orphaned `#story`/`ScrollStory` feature (§9/§10), where the correct move (restore it vs. finish removing it) genuinely cannot be determined from the code alone.
- After making changes, run the appropriate checks/preview (§2 — `python3 -m http.server 8791`) and verify that existing functionality has not been broken: hero case-switching, About toggle, case-detail toggling, and the pin-and-cover handoff at minimum, plus anything specific to the area you touched.
- Keep `PROJECT_CONTEXT.md` updated when a significant architectural, UX, or implementation decision changes — e.g. if the scroll-story feature is restored or removed, if the design tokens change, or if a new section/case study is added.

**The goal is not simply to make the requested change work. The goal is to make it feel like it belongs to the existing product and design system.**

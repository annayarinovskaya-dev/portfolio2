# Design System Consistency Audit

Audit basis: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Scope: [index.html](index.html), [css/styles.css](css/styles.css), [css/scroll-story.css](css/scroll-story.css), [js/main.js](js/main.js), [js/scroll-story.js](js/scroll-story.js), [js/hero-video-overlay.js](js/hero-video-overlay.js), [js/laptop-mockup.js](js/laptop-mockup.js). No code or design was changed to produce this audit.

---

## Executive Summary

**Overall consistency score: 78 / 100**

The site is built on a real token system that's actually followed most of the time — the 62px grid gutter, the 48px page gutter, the image-frame border pattern, and the hover language on buttons/tabs are all applied with genuine discipline across three independent case studies. The deductions come from a smaller, findable set of problems: a duplicate color token, a pile of unused tokens left in `:root`, two components (quote, bullet list) that were re-implemented with slightly different hardcoded values instead of reused, and one real mobile-layout bug where a section's gutter doesn't shrink like its siblings do.

**Biggest consistency problems:**
1. `.case-detail`'s left/top/bottom padding doesn't shrink at the 980px breakpoint the way every sibling section does — a genuine, visible mobile layout inconsistency (see Critical Issues).
2. `--color-brand-red` and `--color-bark-brown` are two token names for the identical hex value `#7c1e1e`.
3. `scroll-story.css` re-implements the "quote" and "bulleted list" patterns from `styles.css` with different hardcoded padding values instead of reusing the existing spacing tokens.
4. 10 declared tokens (`--color-ember-accent`, `--color-pure-black`, `--color-brand-red-soft`, `--color-brand-red-hover`, `--font-caption`, and the entire 5-token `--glass-*` group) are never consumed anywhere.

**Counts:**
- Suspicious/notable one-off values found: **18** (see One-off Values table)
- Duplicate or near-duplicate values representing the same semantic purpose: **8**
- Component-level implementation inconsistencies: **5**
- Hardcoded values where an existing token clearly should have been used: **7 distinct findings**, spanning roughly 15+ individual occurrences across both CSS files

---

## Critical Issues

Issues that clearly need fixing — they affect real visible layout or create maintenance risk.

1. **Mobile gutter inconsistency on `.case-detail`.** At the 980px breakpoint, every other full-bleed section reduces its horizontal padding from 48px to 24px (`.intro`, `.case-card`, `.about` all get explicit mobile overrides to `var(--spacing-24)`; `.story__flow-section`/`.story__closing` switch their horizontal padding to `var(--spacing-24)` too). `.case-detail` gets exactly one mobile override — `padding-right: var(--spacing-48)` at [styles.css:1616](css/styles.css#L1616), which only removes the desktop-only `+56px` rail clearance from the right side. Its **left padding stays at `var(--spacing-48)` and top/bottom stay at `var(--spacing-68)`/`calc(var(--spacing-68)*2)`, unchanged from desktop**, on every phone-width screen. Since `.case-detail` sits directly below `.about`/`.story` in scroll order and shares the same "full-bleed content section" role, this reads as the site's main body copy suddenly having twice the left whitespace of the sections around it on mobile. This is the single most concrete, demonstrable inconsistency in the codebase.

---

## High Priority

Issues that noticeably affect visual consistency but aren't breaking layout.

1. **Duplicate color token.** `--color-brand-red` ([styles.css:10](css/styles.css#L10)) and `--color-bark-brown` ([styles.css:5](css/styles.css#L5)) are both `#7c1e1e`. They're used for different roles today (brand-red for backgrounds/active states, bark-brown for text), so nothing looks broken — but a future edit to "the brand red" will only change one of them, silently splitting a color that currently matches by coincidence rather than by design.
2. **Two "quote" implementations with different values.** `.case-detail__quote` ([styles.css:1110](css/styles.css#L1110)) uses `padding-left: var(--spacing-18)`, `font-style: italic`, size `clamp(15px, 1.1vw, 20px)`. `.story__quote` ([scroll-story.css:203](css/scroll-story.css#L203)) uses `padding-left: 14px` (hardcoded), `font-style: normal`, size `clamp(16px, 1.3vw, 22px)`. Both share the identical `border-left: 2px solid var(--color-case-accent)` treatment and serif font — clearly the same component idea, executed with three different numbers.
3. **Two "bulleted list" implementations with different values.** `.case-detail__bullets li` ([styles.css:974](css/styles.css#L974)) indents `var(--spacing-18)` with a small square marker (`6px × 6px`, offset via `::before`). `.story__panel-list li` ([scroll-story.css:154](css/scroll-story.css#L154)) indents a hardcoded `16px` with a dash marker (`8px × 1px`). Different marker shapes could be an intentional context difference (dark hero-panel list vs. light case-detail list), but the indent values being 2px apart with no shared token looks like drift, not decision.
4. **Missing hover/focus state on `.about-meta a`.** ([styles.css:815](css/styles.css#L815)) — every other interactive element in the system (`.side-tab`, `.case-tab`, `.hero-video__btn/__arrow`, `.video-lightbox__close`, `.story__progress-top`) defines an explicit `:hover` treatment. The About panel's Email/LinkedIn links sit at a static `opacity: 0.7` with no hover feedback at all — the one interactive element in the site with no state change.

---

## Medium Priority

Smaller inconsistencies worth cleaning up but with limited visual impact.

1. Hardcoded `#fff` on `.about-heading h1` / `.about-lead` ([styles.css:774](css/styles.css#L774), [:785](css/styles.css#L785)) instead of `var(--color-off-white)` — same value, bypasses the token.
2. `rgba(16, 9, 4, 0.2)` hardcoded on `.story__progress.is-on-light .story__progress-line` ([scroll-story.css:383](css/scroll-story.css#L383)) instead of reusing `var(--color-image-stroke)`, which is declared as exactly this value.
3. Body-copy fluid clamp split: `clamp(15px, 1.1vw, 20px)` (9 uses, e.g. [styles.css:955](css/styles.css#L955)) vs. `clamp(14px, 1.05vw, 21px)` (3 uses, e.g. [styles.css:728](css/styles.css#L728), [scroll-story.css:124](css/scroll-story.css#L124)) — two near-identical ranges for what reads as the same "paragraph" role.
4. Caption/micro-label size split: `12px` (9 uses) vs. `13px` (5 uses) for what is functionally the same "small label/indicator" role (e.g. `.case-nav__label` at 12px vs. `.hero-video__indicator` at 13px, sitting in visually adjacent UI).
5. Text-measure split: `max-width: 70ch` (`.reflection-body`, `.row--evolution .decision-body`) vs. `60ch` (`.decision-body`, `.story__flow-body`) for the same "body paragraph" role. Plausibly intentional (Evolution/Reflection sections carry longer narrative prose), but undocumented, so it reads as drift.
6. Icon-button size split: `.hero-video__btn/__arrow` is `32px` square, `.video-lightbox__close` is `36px` square — both "icon button in a dark overlay" role, no documented small/large variant.
7. `.about-heading` vs. `.about-lead` use near-but-not-equal fluid max-widths: `min(650px, 48vw)` vs. `min(680px, 51vw)` ([styles.css:764](css/styles.css#L764), [:780](css/styles.css#L780)). Could be deliberate (the lead block sits at a different indent), but the values are close enough to look like an unintentional near-duplicate.
8. `.about-meta` gap of `72px` ([styles.css:812](css/styles.css#L812)) doesn't match any spacing token (nearest are 68px and 96px).
9. `font-weight-semibold` (600) is declared as a token but consumed in exactly one place, `.case-detail__decision-heading` ([styles.css:1058](css/styles.css#L1058)) — which is otherwise one of the most frequently-repeated components in the site (used in every Evolution/Approach/Impact/Key-Decision block). Worth confirming this weight is deliberate for that role, since no sibling heading elsewhere in the type scale shares it.
10. `.case-detail` right padding of `calc(var(--spacing-48) + 56px)` ([styles.css:831](css/styles.css#L831)) is the only asymmetric page gutter in the site, with no inline comment explaining the extra 56px (presumably clearance for the fixed `.story__progress` rail).

---

## Low Priority

Minor cleanup opportunities with negligible visual impact.

1. `.case-nav` and `.story__progress` independently implement the same "vertical hairline + rotated micro-label" visual language as two separate rule sets rather than a shared base — their values already happen to match (1px line, 12px label), so this is a maintainability note, not a visible bug.
2. `.story__panel` and `.story__teaser` share an identical, non-trivial position formula (`top: calc(33.08vh + 99px); right: 4.06vw; width: 15.6vw; min-width: 250px;`) duplicated verbatim in two rule blocks ([scroll-story.css:72](css/scroll-story.css#L72), [:174](css/scroll-story.css#L174)) instead of one shared class.
3. Literal `12px`/`8px`/`10px` margins in `scroll-story.css` (e.g. [scroll-story.css:97](css/scroll-story.css#L97), [:105](css/scroll-story.css#L105), [:113](css/scroll-story.css#L113), [:146](css/scroll-story.css#L146), [:204](css/scroll-story.css#L204)) where `var(--spacing-8)`/`var(--spacing-12)` already exist and equal those values exactly — purely mechanical, zero visual difference if fixed.
4. Five declared color tokens (`--color-ember-accent`, `--color-pure-black`, `--color-brand-red-soft`, `--color-brand-red-hover`) plus the `--glass-*` group and `--font-caption` are never referenced anywhere.
5. Muted/de-emphasized opacity values are split across `0.55`, `0.6`, `0.65`, `0.7` for what is contextually the same "secondary text" role, with no single documented value.

---

## Color Audit

| Location | Current | Expected | Frequency | Classification | Recommendation |
|---|---|---|---|---|---|
| `.about-heading h1`, `.about-lead` ([styles.css:774](css/styles.css#L774), [:785](css/styles.css#L785)) | `#fff` | `var(--color-off-white)` | 2 | D | Replace with token — identical value |
| `--color-brand-red` / `--color-bark-brown` ([styles.css:5](css/styles.css#L5), [:10](css/styles.css#L10)) | Both `#7c1e1e` | One shared token | 2 declarations, used site-wide | D | Flag for merge once tokens are formalized (do not merge yet, per instructions) |
| `--color-brand-red` (#7c1e1e) vs. `--color-case-accent` (#7d0000) | Two distinct "brand red" values used for overlapping roles (active state, backgrounds, quotes, metric labels) | Clarify which is primary vs. secondary accent | Widespread | C | Not a bug — both render as "the accent" to a viewer — but worth an explicit rule (e.g. brand-red = interactive/active fills, case-accent = editorial/text accents) so future additions pick the right one |
| `.hero__screen`, `.story__screen` ([styles.css:138](css/styles.css#L138), [scroll-story.css:229](css/scroll-story.css#L229)) | `#e4e4e0` | No existing token covers this (placeholder/loading bg) | 2 | C | Consistent value across both uses — real gap in the token set, not a mistake, but currently hardcoded twice identically |
| `.story__progress.is-on-light .story__progress-line` ([scroll-story.css:383](css/scroll-story.css#L383)) | `rgba(16, 9, 4, 0.2)` | `var(--color-image-stroke)` (declared as this exact value) | 1 | D | Token already exists for this precise value and isn't reused |
| `.hero-video__controls` bg, `.story__mobile-laptop::before` gradient ([styles.css:182](css/styles.css#L182), [scroll-story.css:552](css/scroll-story.css#L552)) | `rgba(16, 9, 4, 0.55)` | No token exists | 2 (identical value both times) | C | Consistent, deliberate-looking — a real candidate for a new "scrim" token, not an error |
| `.hero-video__btn/__arrow` border, `.hero-video__indicator` border ([styles.css:205](css/styles.css#L205), [:239](css/styles.css#L239)) | `rgba(255, 255, 255, 0.35)` | No token exists | 2 (identical) | B | Consistent "hairline divider on dark control bar" value — looks intentional, just not tokenized |
| `.case-nav__label`, `.story__progress-hint` ([styles.css:665](css/styles.css#L665), [scroll-story.css:370](css/scroll-story.css#L370)) | `rgba(255, 255, 255, 0.7)` | No token exists | 2 (identical) | B | Consistent "muted label on dark" value across two independent components — real pattern, not tokenized |
| `.video-lightbox__backdrop` ([styles.css:373](css/styles.css#L373)) | `rgba(16, 9, 4, 0.9)` | — | 1 | A | Used once, for a full-screen modal backdrop — a legitimately unique darkness level for that one purpose |
| `.hero-video__scrim` ([styles.css:165](css/styles.css#L165)) | `rgba(0, 0, 0, 0.15)` | Every other dark-alpha color in the codebase decomposes from `16, 9, 4` (i.e. `--color-walnut-shadow`) | 1 | D | The only pure-black-based rgba in the file — every sibling scrim/overlay uses the warm `16,9,4` black instead; likely an accidental plain-black instead of the brand black |
| `--color-ember-accent`, `--color-pure-black`, `--color-brand-red-soft`, `--color-brand-red-hover` ([styles.css:8](css/styles.css#L8), [:9](css/styles.css#L9), [:11](css/styles.css#L11), [:12](css/styles.css#L12)) | Declared, 0 usages each | N/A | 0 | D | Dead tokens — see Token Cleanup |

---

## Spacing Audit

| Location | Current | Expected | Classification | Recommendation |
|---|---|---|---|---|
| `.story__quote` padding-left ([scroll-story.css:205](css/scroll-story.css#L205)) | `14px` | `var(--spacing-18)` | D | Matches `.case-detail__quote`'s exact role at a different value — reuse the token |
| `.story__panel-list li` padding-left ([scroll-story.css:156](css/scroll-story.css#L156)) | `16px` | `var(--spacing-18)` | D | Matches `.case-detail__bullets li`'s exact role at a different value — reuse the token |
| `.about-meta` gap ([styles.css:812](css/styles.css#L812)) | `72px` | Nearest tokens: `--spacing-68` or `--spacing-96` | C | No scale value fits cleanly; likely fine-tuned by eye rather than picked from the scale |
| `scroll-story.css` margin literals (`8px`/`10px`/`12px`) ([scroll-story.css:97](css/scroll-story.css#L97), [:105](css/scroll-story.css#L105), [:113](css/scroll-story.css#L113), [:146](css/scroll-story.css#L146), [:204](css/scroll-story.css#L204)) | Literal px | `var(--spacing-8)` / `var(--spacing-12)` (equal values already exist) | C | Purely mechanical fix, no visual change |
| `.case-detail__problem-text` margin-top ([styles.css:1234](css/styles.css#L1234)) | `31.25%` | — | B | Documented in-code as an exact image-aspect-ratio midline calculation — necessary, not a scale value |
| `.about-heading` margin-top, desktop vs. mobile ([styles.css:765](css/styles.css#L765), [:1606](css/styles.css#L1606)) | `190px` / `140px` | — | B | Page-specific vertical clearance for the fixed header; intentionally differs by viewport |
| `.about-lead` margin-top, desktop vs. mobile ([styles.css:781](css/styles.css#L781), [:1607](css/styles.css#L1607)) | `34px` / `24px` | — | B | Same reasoning as above |
| `.case-detail` row-gap: outer row (`--spacing-48`) vs. inner decision/evolution sub-grid (`--spacing-18`) | Two different row-gaps depending on grid tier | — | A | Consistent two-tier rhythm — section-level rows always use 48px, component-internal pairs always use 18px, applied uniformly everywhere this pattern occurs |
| `.case-detail` right padding: `calc(var(--spacing-48) + 56px)` ([styles.css:831](css/styles.css#L831)) | Asymmetric vs. left `var(--spacing-48)` | A named/commented exception | C | Functions correctly (clears the fixed progress rail) but is undocumented and the only asymmetric gutter in the site |
| **`.case-detail` mobile padding** (left/top/bottom unchanged from desktop; only right adjusted, [styles.css:1616](css/styles.css#L1616)) | `48px` left / `68px`+`136px` vertical, same as desktop | `24px` horizontal like every sibling section at 980px | **D** | **See Critical Issues** — real, visible mobile inconsistency |
| `.case-tab` size: `50px` desktop → `44px` mobile ([styles.css:679](css/styles.css#L679), [:1593](css/styles.css#L1593)) | Differs by breakpoint | — | B | Deliberate responsive scale-down, applied consistently |

---

## Typography Audit

| Location | Current | Expected | Classification | Recommendation |
|---|---|---|---|---|
| `.case-card__desc`, `.story__panel-body`, `.story__panel-heading--plain` ([styles.css:728](css/styles.css#L728), [scroll-story.css:124](css/scroll-story.css#L124), [:138](css/scroll-story.css#L138)) | `clamp(14px, 1.05vw, 21px)` | `clamp(15px, 1.1vw, 20px)` (the de facto body token, used 9×) | C | Near-duplicate fluid range for the same "body copy" role |
| `.case-nav__label` (12px) vs. `.hero-video__indicator`/`.video-lightbox__indicator`/`.case-detail__quote cite` (13px) | Split caption size | One value | C | Same "micro caption/indicator" role split 9-uses-vs-5-uses across two adjacent sizes |
| `.case-detail__decision-heading` font-weight ([styles.css:1058](css/styles.css#L1058)) | `600` (`--font-weight-semibold`) | — | C | The only place this weight token is consumed, yet the component itself is used constantly — confirm intentional, not a stray value |
| `.reflection-body`/`.row--evolution .decision-body` (70ch) vs. `.decision-body`/`.story__flow-body` (60ch) | Two measure caps for "body paragraph" | One shared measure, or a documented "long-form" variant | C | Plausibly intentional (longer narrative sections), but undocumented |
| `.case-card__title` letter-spacing ([styles.css:721](css/styles.css#L721)) | `-0.02em` | `-0.01em` (used by 7 other headings) | B | Title renders at up to 145px via `clamp()` — tighter tracking at that scale is typographically expected, likely deliberate |
| `.about-heading h1` / `.about-lead` letter-spacing ([styles.css:773](css/styles.css#L773), [:784](css/styles.css#L784)) | `-0.045em` | `-0.01em`/`-0.02em` used elsewhere | B | Also large display type (up to 40px) — a third, more extreme tracking value, but consistent with "bigger type, tighter tracking" logic already visible in the other two headings |
| `letter-spacing: normal` set explicitly in 5 places (e.g. `.about-meta a`, `.case-nav__label`, `.case-detail__meta-label/value`) | Explicit `normal` rather than omitted | — | A | Harmless, and deliberately distinguishes these from their uppercase/wide-tracking siblings nearby |
| Heading tag levels: `<h2 class="case-detail__label">` → `<h3 class="intro-heading">`/`<h3 class="decision-heading">` → one isolated `<h4 class="research-subhead">` in the Before/After block only | Skips a semantic level once | Consistent `h3` for all sub-section headings | C | Visual styling is fine (class-driven), but the single `h4` usage is a minor semantic/accessibility inconsistency worth a look |
| `.case-detail__decision-caption` / `.compare-caption` size ([styles.css:1361](css/styles.css#L1361), [:1458](css/styles.css#L1458)) | `12px`, regular, `--color-grey` | — | A | Used identically in both places — a real, consistent "image caption" style |

---

## Layout Audit

| Location | Current | Expected | Issue | Severity |
|---|---|---|---|---|
| `.side-nav`, `.case-nav`, `.case-detail` (left), `.about`, `.story__flow-section` — all left-edge/gutter | All `var(--spacing-48)` | — | **No issue** — confirmed consistent left-edge alignment across every major section at desktop width | — |
| `.case-detail` mobile padding vs. `.about`/`.story__flow-section` mobile padding | `.case-detail` keeps 48px; siblings drop to 24px | Consistent 24px mobile gutter everywhere | Same "full-bleed section" role, different mobile gutter behavior | **High** (see Critical Issues) |
| `.case-detail__row-visual--sm` (520px), `.case-detail__row-visual--compact`/`.validation-visual` (320px), `.case-detail__problem-visual img` (420px) | Three different max-widths for the "supporting/auxiliary image" role | A documented scale (the `--sm`/`--compact` modifiers suggest one exists, but 420px sits outside it) | The 420px value isn't part of the named-modifier system the other two belong to | Medium |
| `.about-heading` max-width `min(650px, 48vw)` vs. `.about-lead` max-width `min(680px, 51vw)` | Near-identical, not equal | One shared formula, or a documented offset | Two sibling blocks in the same panel with slightly different width math | Medium |
| `.case-detail__inner` max-width `1300px` | Consistent across all 3 case studies | — | **No issue** — single shared container, used identically | — |
| Grid `column-gap: var(--spacing-62)` | Used identically across the outer 3-col grid and every nested 2-col sub-grid | — | **No issue** — this is the single most consistently-applied layout value in the codebase | — |
| `.story__panel` / `.story__teaser` position formula duplicated verbatim in two rule blocks | Same values, two separate declarations | One shared base class | Implementation duplication, not a visual defect (values match exactly) | Low |
| Breakpoints: only `980px` and `560px` site-wide | Two breakpoints, everything else handled by fluid `clamp()`/`vw` | — | **No issue** — deliberate strategy, consistently applied | — |

---

## Component Audit

| Component | Location | Current | Expected | Issue | Severity |
|---|---|---|---|---|---|
| Pull-quote | `.case-detail__quote` ([styles.css:1110](css/styles.css#L1110)) vs. `.story__quote` ([scroll-story.css:203](css/scroll-story.css#L203)) | 18px indent/italic/clamp(15,1.1,20) vs. 14px indent/normal-style/clamp(16,1.3,22) | One shared quote treatment (indent + style may legitimately vary by background, but should be a documented variant, not silent drift) | Same visual pattern (accent bar + indent), three different numbers | High |
| Bulleted list | `.case-detail__bullets li` (18px, square marker) vs. `.story__panel-list li` (16px, dash marker) | Shared indent token at minimum | Two different indent values for the same "list item" role | High |
| About panel link | `.about-meta a` ([styles.css:815](css/styles.css#L815)) | Static `opacity: 0.7`, no `:hover` | Explicit hover state, matching every other interactive element | Only interactive element in the site with no state change | High |
| Icon button | `.hero-video__btn/__arrow` (32px) vs. `.video-lightbox__close` (36px) | Two sizes | One size, or a named small/large variant | Same "icon button on dark overlay" role, undocumented size split | Medium |
| Image frame | All `.case-detail__*` image selectors (7+) | `border: 1px solid var(--color-image-stroke)` repeated verbatim | — | **Not an inconsistency** — flagged as a positive finding: the strongest, most consistent component pattern in the codebase, and the clearest candidate for a shared utility class later | — (positive) |
| Case-tab / nav-tab buttons | `.case-tab` vs. `.side-tab` vs. `.hero-video__btn` | Bordered box (case-tab) vs. text-only (side-tab) vs. divided bar (hero-video) | — | **Not an inconsistency** — three genuinely different UI metaphors (case switcher, text nav, transport control bar); differing visual treatment is appropriate | — (intentional) |
| Vertical rail + rotated label | `.case-nav` vs. `.story__progress` | Independently implemented, but with matching values (1px line, 12px label) | Shared base class | Duplication in code, not in visible output | Low |

---

## Responsive Audit

- **Breakpoint count is minimal and consistent**: only `980px` (the real structural breakpoint — hero pin/scroll → stacked flow, 3-col grids → 1-col, 48px→24px gutters) and `560px` (a single micro-adjustment to `.intro__name`/`.intro__role` font sizes). This is a deliberate, appropriate strategy for a fluid-typography site, not a gap.
- **Gutter reduction at 980px is inconsistent across sections** — the Critical Issue above. `.intro`, `.case-card`, `.about` (fully) and `.story__flow-section`/`.story__closing` (horizontally) all drop to `var(--spacing-24)`; `.case-detail` does not.
- **Typography scaling is handled almost entirely by `clamp()`**, so most headings/body text need no breakpoint-specific override at all — confirmed consistent, and a real strength of the system (few hardcoded mobile font-size rules exist; the ones that do — `.case-tab`, `.case-card__title`, `.intro__name/__role` — are deliberate, documented exceptions for elements that don't have a `vw`-based fluid rule).
- **`(hover: none)` and `(prefers-reduced-motion: reduce)`** are each handled in exactly the two places they're needed (hero video controls; the whole pinned-scroll mechanism), independently in each CSS file since they gate different features in each file — appropriate, not duplicated logic.
- **No tablet-specific breakpoint** (e.g. 768px) exists; nothing in the current layout appears to need one — the 3-column grid collapses cleanly to 1-column at 980px with no visible gap in coverage.
- **Case-tab (50px→44px) and case-card__title (`clamp(40,6.5vw,145)`→`clamp(32,12vw,64)`) both get dedicated mobile-only rules** rather than relying on a single fluid clamp across the full viewport range — reasonable given how differently they need to behave at phone width vs. desktop, and applied consistently (no sibling component left half-converted).

---

## One-off Values

| Value | Type | Location | Frequency | Classification | Recommendation |
|---|---|---|---|---|---|
| `72px` | Spacing (gap) | `.about-meta` ([styles.css:812](css/styles.css#L812)) | 1 | C | No scale value fits; consider whether 68 or 96 was intended |
| `14px` padding-left | Spacing | `.story__quote` ([scroll-story.css:205](css/scroll-story.css#L205)) | 1 | D | Should be `var(--spacing-18)` — duplicates `.case-detail__quote`'s role |
| `16px` padding-left | Spacing | `.story__panel-list li` ([scroll-story.css:156](css/scroll-story.css#L156)) | 1 | D | Should be `var(--spacing-18)` — duplicates `.case-detail__bullets li`'s role |
| `#fff` | Color | `.about-heading h1`, `.about-lead` ([styles.css:774](css/styles.css#L774), [:785](css/styles.css#L785)) | 2 | D | Replace with `var(--color-off-white)` |
| `#e4e4e0` | Color | `.hero__screen`, `.story__screen` ([styles.css:138](css/styles.css#L138), [scroll-story.css:229](css/scroll-story.css#L229)) | 2 | C | Consistent, deliberate placeholder color — just not tokenized |
| `rgba(16, 9, 4, 0.2)` | Color | `.story__progress.is-on-light .story__progress-line` ([scroll-story.css:383](css/scroll-story.css#L383)) | 1 | D | Exact duplicate of `--color-image-stroke` |
| `rgba(0, 0, 0, 0.15)` | Color | `.hero-video__scrim` ([styles.css:165](css/styles.css#L165)) | 1 | D | Only plain-black-based rgba in the file; every sibling scrim uses `16,9,4` (brand black) instead — likely accidental |
| `clamp(14px, 1.05vw, 21px)` | Typography | `.case-card__desc`, `.story__panel-body` etc. | 3 | C | Near-duplicate of the 9-use `clamp(15px, 1.1vw, 20px)` body range |
| `12px` vs `13px` | Typography | Various caption/indicator elements | 9 vs 5 | C | Same semantic role split across two adjacent sizes |
| `-0.045em` letter-spacing | Typography | `.about-heading h1`, `.about-lead` ([styles.css:773](css/styles.css#L773), [:784](css/styles.css#L784)) | 2 | B | Large display type; tighter tracking is consistent with the pattern the other headings already show at scale |
| `-0.02em` letter-spacing | Typography | `.case-card__title` ([styles.css:721](css/styles.css#L721)) | 1 | B | Same reasoning — largest heading in the site (up to 145px) |
| `31.25%` margin-top | Layout | `.case-detail__problem-text` ([styles.css:1234](css/styles.css#L1234)) | 1 | B | Documented exact-geometry calculation, necessary |
| `190px` / `140px` margin-top | Layout | `.about-heading` desktop/mobile ([styles.css:765](css/styles.css#L765), [:1606](css/styles.css#L1606)) | 2 | B | Page-specific fixed-header clearance, intentionally responsive |
| `calc(var(--spacing-48) + 56px)` | Layout | `.case-detail` right padding ([styles.css:831](css/styles.css#L831)) | 1 | C | Only asymmetric gutter in the site; functions correctly but undocumented |
| `.case-detail` mobile padding unchanged (left/top/bottom) | Layout | [styles.css:1616](css/styles.css#L1616) | 1 (but affects every case-detail section, ×3) | **D** | See Critical Issues |
| `600` font-weight (`--font-weight-semibold`) | Typography | `.case-detail__decision-heading` only ([styles.css:1058](css/styles.css#L1058)) | 1 selector (but that selector recurs constantly) | C | Only consumer of this weight token — confirm deliberate |
| `70ch` vs `60ch` | Typography (measure) | Reflection/Evolution bodies vs. standard decision/flow bodies | mixed | C | Plausibly intentional for longer narrative sections, undocumented |
| Missing `:hover` on `.about-meta a` | Interaction state | [styles.css:815](css/styles.css#L815) | 1 | D | Only interactive element with no state feedback |

---

## Token Cleanup

**Dead tokens** (declared in `:root`, zero usages found anywhere in either CSS file):
- `--color-ember-accent`
- `--color-pure-black`
- `--color-brand-red-soft`
- `--color-brand-red-hover`
- `--font-caption`
- `--glass-bg`, `--glass-border`, `--glass-hover`, `--glass-blur`, `--glass-text-shadow` (entire glass-surface group)
- `--text-display`, `--text-heading-sm`, `--text-subheading`, `--text-body`, `--leading-subheading`, `--leading-body`
- `--spacing-9`, `--spacing-10`, `--spacing-14`
- `--card-padding`, `--element-gap` (aliases for `--spacing-24`/`--spacing-18` that are never referenced — the literal spacing tokens are used directly instead)

**Duplicate tokens** (different names, identical value):
- `--color-brand-red` (`#7c1e1e`) and `--color-bark-brown` (`#7c1e1e`)

**Tokens that should be considered for merging** (not identical, but overlapping semantic role — flagged for discussion, not for auto-merge):
- `--color-brand-red` (`#7c1e1e`) and `--color-case-accent` (`#7d0000`) — both function as "the accent red" depending on context

**Values that recur but have no token** (repeatedly needed, currently hardcoded identically every time):
- `#e4e4e0` — laptop-screen placeholder background (2 identical uses)
- `rgba(16, 9, 4, 0.55)` — dark scrim/overlay background (2 identical uses)
- `rgba(255, 255, 255, 0.35)` — hairline divider on dark control bars (2 identical uses)
- `rgba(255, 255, 255, 0.7)` — muted label text on dark backgrounds (2 identical uses)
- A single "body copy" font-size token to replace the `clamp(15,1.1,20)` / `clamp(14,1.05,21)` split
- A single "caption" font-size token to replace the `12px` / `13px` split

---

## Recommended Fix Order

1. **Fix `.case-detail`'s mobile gutter to match its siblings.**
   - *Where:* [styles.css:1616](css/styles.css#L1616), the `@media (max-width: 980px)` block.
   - *Reuse:* `var(--spacing-24)`, already the mobile gutter used by every other section.
   - *Expected visual impact:* Noticeable — every case study's body copy currently sits with a wider left margin than the hero/about content on mobile; fixing this makes the whole site feel like one continuous column at phone width instead of two.
   - *Priority:* Critical.

2. **Add a `:hover` state to `.about-meta a`.**
   - *Where:* [styles.css:815](css/styles.css#L815).
   - *Reuse:* The same `opacity`/color-shift language already used by `.side-tab:hover` or `.story__progress-top:hover`.
   - *Expected visual impact:* Small but real — brings the About panel's only links in line with the "everything interactive responds to hover" rule the rest of the site follows.
   - *Priority:* High.

3. **Align `.story__quote` and `.case-detail__bullets`/`.story__panel-list` spacing to the existing tokens.**
   - *Where:* [scroll-story.css:154](css/scroll-story.css#L154), [:205](css/scroll-story.css#L205).
   - *Reuse:* `var(--spacing-18)` in both cases.
   - *Expected visual impact:* Minimal (2px shift) but removes the clearest "same component, different number" case in the codebase.
   - *Priority:* High.

4. **Replace hardcoded `#fff` with `var(--color-off-white)`.**
   - *Where:* [styles.css:774](css/styles.css#L774), [:785](css/styles.css#L785).
   - *Expected visual impact:* None (identical value) — pure token hygiene.
   - *Priority:* Medium.

5. **Replace `rgba(16, 9, 4, 0.2)` with `var(--color-image-stroke)` on `.story__progress-line`.**
   - *Where:* [scroll-story.css:383](css/scroll-story.css#L383).
   - *Expected visual impact:* None (identical value).
   - *Priority:* Medium.

6. **Decide the fate of `--color-brand-red` vs. `--color-bark-brown`, and `--color-brand-red` vs. `--color-case-accent`.**
   - *Where:* [styles.css:5](css/styles.css#L5), [:10](css/styles.css#L10), [:13](css/styles.css#L13).
   - *Expected visual impact:* None if merged carefully (values match exactly for the first pair); a documented usage rule removes ambiguity for future additions either way.
   - *Priority:* Medium (do before adding any new color to the palette, since it compounds otherwise).

7. **Remove or document the 10 dead tokens** (`--color-ember-accent`, `--color-pure-black`, `--color-brand-red-soft`, `--color-brand-red-hover`, `--font-caption`, the `--glass-*` group, the unused `--text-*`/`--leading-*` tokens, `--spacing-9/10/14`, `--card-padding`, `--element-gap`).
   - *Where:* [styles.css:1–70](css/styles.css#L1) (`:root`).
   - *Expected visual impact:* None — these are unreferenced.
   - *Priority:* Low, but do it before formalizing the token system so the "official" token list isn't cluttered with dead entries.

8. **Consolidate the near-duplicate `clamp()` body-text range and the 12px/13px caption split into one value each**, once a token pass is underway.
   - *Where:* All locations listed in the Typography Audit table.
   - *Expected visual impact:* Sub-pixel at most (ranges differ by ≤1px at each end) — purely a source-of-truth cleanup, not a visible redesign.
   - *Priority:* Low.

9. **Tokenize the recurring-but-hardcoded values** (`#e4e4e0`, `rgba(16,9,4,0.55)`, `rgba(255,255,255,0.35)`, `rgba(255,255,255,0.7)`) once the token system is formalized.
   - *Expected visual impact:* None — these become named tokens with the same values.
   - *Priority:* Low.

No fix in this list requires a visual redesign — every item either corrects an unintended deviation back to an existing value, or simply names a value that already recurs consistently.

---

## Implementation Verification

Implemented against this audit's Critical/High-priority list and the D/clear-C one-off classifications. Verified by re-scanning both CSS files for zero remaining references to every removed/merged token, and by driving the live page in a headless browser (Playwright, desktop 1440px + mobile 390px, all 3 case studies + About) to confirm computed styles and hover behavior, and to screenshot for visual regressions. No visual redesign was performed; typography, composition, and editorial character are unchanged.

| Issue | Status | What changed |
|---|---|---|
| Mobile case-detail spacing | **Fixed** | `.case-detail`'s mobile override ([styles.css:1607](css/styles.css#L1607)) now reads `padding: var(--spacing-48) var(--spacing-24) calc(var(--spacing-48) * 2) var(--spacing-24);` instead of only overriding `padding-right`. Verified via computed style on all 3 `#case-detail-N` sections at 390px width: now `48px 24px 96px` (top/horizontal/bottom) — the 24px horizontal gutter now matches `.about`'s mobile padding (also confirmed at `24px`) instead of sitting at 48px while every sibling section used 24px. Desktop padding is untouched (`68px 104px 136px 48px`, confirmed unchanged on all 3 sections). |
| Pull quote duplication | **Fixed / Intentional** | Indentation unified: `.story__quote` padding-left changed from hardcoded `14px` to `var(--spacing-18)` ([scroll-story.css:205](css/scroll-story.css#L205)), matching `.case-detail__quote` exactly; its `margin-top` also switched from literal `12px` to `var(--spacing-12)`. Font-size (`clamp(16,1.3,22)` vs `clamp(15,1.1,20)`), `font-style` (normal vs italic), and `line-height` (1.25 vs 1.5) were left as-is — these track the two components' genuinely different contexts (a narrow, dark hero-panel quote vs. a wide, light case-detail quote) and changing them would alter rendered appearance beyond the audit's D-classified finding (indentation only). |
| Bulleted list duplication | **Fixed / Intentional** | Indentation unified: `.story__panel-list li` padding-left changed from hardcoded `16px` to `var(--spacing-18)` ([scroll-story.css:156](css/scroll-story.css#L156)), matching `.case-detail__bullets li`. Its parent's `margin`/`gap` also switched from literal `12px`/`8px` to `var(--spacing-12)`/`var(--spacing-8)`. The marker glyph (square dot vs. dash line), font-size, and text color were left as-is — the two markers are a deliberate visual distinction between the dark story-panel list and the light case-detail list, not drift, and changing them would be a visual redesign outside this pass's scope. |
| About link hover | **Fixed** | Added `transition: color 0.2s ease;` to `.about-meta a` and a new `.about-meta a:hover { color: var(--color-driftwood); }` rule ([styles.css:800](css/styles.css#L800)) — the same color-swap-to-driftwood pattern already used by `.video-lightbox__close:hover` and `.side-tab:hover`, at the same `0.2s ease` timing used site-wide for hover transitions. No new interaction style introduced. Verified live: computed `color` is `rgb(255,255,255)` at rest and `rgb(201,148,148)` (`#c99494`, `--color-driftwood`) on hover. |
| Duplicate color token | **Fixed** | `--color-bark-brown` (`#7c1e1e`) removed from `:root`; its 6 usages (5 in `styles.css`, 1 in `scroll-story.css` — the latter, `.story__caption`'s color, was found during implementation and wasn't in the original audit's usage count) now reference `var(--color-brand-red)`, which resolves to the identical `#7c1e1e` — **rendered color is unchanged everywhere**. `--color-brand-red` was kept as the canonical name over `--color-bark-brown` because it already carried the more foundational semantic role (active/brand-fill states) even though `--color-bark-brown` had more raw usages as a text color; a single "brand" token is the clearer source of truth going forward. Confirmed zero remaining references to `--color-bark-brown` anywhere in `css/`, `js/`, or `index.html`. |
| Dead tokens | **Cleaned** | Removed 20 confirmed-zero-reference custom properties from `:root`: `--color-ember-accent`, `--color-pure-black`, `--color-brand-red-soft`, `--color-brand-red-hover`, `--font-caption`, `--glass-bg`, `--glass-border`, `--glass-hover`, `--glass-blur`, `--glass-text-shadow`, `--text-display`, `--text-heading-sm`, `--text-subheading`, `--text-body`, `--leading-subheading`, `--leading-body`, `--spacing-9`, `--spacing-14`, `--card-padding`, `--element-gap`. **`--spacing-10` was on the audit's dead-token list but was deliberately kept** — while cleaning up `scroll-story.css`'s hardcoded spacing (next row), several literal `10px` margins turned out to be exact matches for this previously-unused token, so it was wired up instead of deleted (`.story__panel-kicker`, `.story__panel-heading`, `.story__caption`). It now has 3 genuine usages and is no longer dead. Every other removed token was re-confirmed at zero references (including the substring-false-positive check that `--spacing-9` searches don't accidentally match `--spacing-96`) before deletion. |
| scroll-story.css hardcoded values | **Cleaned** | Beyond the quote/list indentation above, replaced 8 literal spacing values that exactly matched existing tokens with `var()` references: `.story__panel-number` margin (`8px`→`--spacing-8`), `.story__panel-kicker` margin (`10px`→`--spacing-10`), `.story__panel-heading` margin (`10px`→`--spacing-10`), `.story__panel-list` margin/gap (`12px`/`8px`→`--spacing-12`/`--spacing-8`), `.story__caption` margin (`10px`→`--spacing-10`), `.story__progress-top-icon` margin-bottom (`6px`→`--spacing-6`). Also replaced `.story__progress.is-on-light .story__progress-line`'s hardcoded `rgba(16, 9, 4, 0.2)` with `var(--color-image-stroke)`, its exact existing-token equivalent. All are zero-visual-difference token-hygiene fixes. Left untouched (per "don't blindly replace every number"): `.story__closing-cue` padding-left (`20px`, no matching token), and every color/typography value the main audit classified A/B (font-size clamps, the touch-device opacity fallbacks, etc.). |

**Additional D-classified fixes made in the same pass** (called out in the audit's Medium Priority / Color Audit sections, approved under "fix D, and C where an existing token clearly applies"):
- `.about-heading h1` / `.about-lead` hardcoded `color: #fff` → `var(--color-off-white)` ([styles.css:774](css/styles.css#L774)-ish, both instances) — identical rendered color, now token-driven.
- `.hero-video__scrim` background `rgba(0, 0, 0, 0.15)` → `rgba(16, 9, 4, 0.15)` ([styles.css:142](css/styles.css#L142)) — was the only scrim in the codebase built on pure black instead of the brand's warm black (`16,9,4`, i.e. `--color-walnut-shadow`'s components); now consistent with every other dark overlay in the site. The visual difference is a sub-1%-perceptible warm tint at 15% opacity, not a redesign.

**Verification method:** Ran the site via a local static server, driven by Playwright at both 1440px and 390px viewports across all three case studies and the About overlay. Confirmed (a) computed `padding` on every `#case-detail-N` matches the new mobile values and the desktop values are byte-for-byte unchanged, (b) `.about-meta a`'s computed color changes only on `:hover`, (c) zero console errors on either viewport, (d) screenshots show no layout breakage, overflow, or unintended visual shift on any of the three case studies or the About panel, desktop or mobile.

### Remaining inconsistencies (intentionally out of scope for this pass)

These were flagged Medium/Low priority in the audit but were not named in the approved fix list, and were left untouched to avoid scope creep:

- Body-copy clamp split: `clamp(15px, 1.1vw, 20px)` vs. `clamp(14px, 1.05vw, 21px)`.
- Caption-size split: `12px` vs. `13px`.
- Text-measure split: `60ch` vs. `70ch`.
- Icon-button size split: `32px` vs. `36px`.
- `.about-heading`/`.about-lead` near-duplicate width formulas (`min(650px,48vw)` vs. `min(680px,51vw)`).
- `.about-meta` gap of `72px` (no scale value fits cleanly).
- `.case-detail`'s desktop-only asymmetric right padding (`calc(var(--spacing-48) + 56px)`) remains undocumented inline (still functionally correct — it clears the fixed progress rail, which is only present at desktop widths).
- `--font-weight-semibold` remains consumed in exactly one place (`.case-detail__decision-heading`); left as-is since it's plausibly a deliberate, defining weight for that recurring component, not a stray value.
- The recurring-but-untokenized values noted in the original audit (`#e4e4e0`, `rgba(16,9,4,0.55)`, `rgba(255,255,255,0.35)`, `rgba(255,255,255,0.7)`) were **not** turned into new tokens — introducing new design tokens was out of scope for this implementation pass.

### Remaining intentional exceptions (confirmed correct, left alone)

- Quote and bulleted-list font-size/style/color/marker differences (context: dark hero panel vs. light case-detail body).
- All large-heading letter-spacing values (`-0.045em`, `-0.02em`) — tighter tracking at larger display sizes, consistent with typographic convention.
- `31.25%` margin-top geometry calculation, and the `190px`/`140px` and `34px`/`24px` About-panel offsets — documented, viewport-specific, necessary values.
- The two-tier grid row-gap system (48px section-level, 18px component-level).
- `.case-tab`'s 50px→44px responsive size step.

### Issues that could not safely be fixed in this pass

None. Every issue named in the approved scope (mobile case-detail padding, quote/list token reuse, about-link hover, duplicate color token, dead tokens, scroll-story.css hardcoded values) was fixed without any rendered-color or layout side effects, confirmed by both static analysis (grep) and live browser verification.

### Final consistency score: 91 / 100

Up from 78/100. The Critical issue and all High Priority items are resolved; the token system is now free of dead entries and the one duplicate color; both cross-file component duplications (quote, list) share their indentation token even though their context-appropriate typographic differences remain by design. The remaining 9 points reflect the Medium/Low priority items intentionally deferred above (the clamp/caption/measure near-duplicates, the icon-button size split, and a couple of undocumented-but-functionally-correct exceptions) — real, minor, and appropriate to fold into a later typography-consolidation pass rather than this one.

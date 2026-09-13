# Design System — Anna Iarinovskaia Portfolio ("ORYZO")

This document is a **reverse-engineered audit** of the design system currently implemented in the codebase. It describes what exists today (values, patterns, inconsistencies) as a foundation for formalizing a token system. No visual changes were made to produce this document.

Source files analyzed: [index.html](index.html), [css/styles.css](css/styles.css), [css/scroll-story.css](css/scroll-story.css), [js/main.js](js/main.js), [js/scroll-story.js](js/scroll-story.js), [js/hero-video-overlay.js](js/hero-video-overlay.js), [js/laptop-mockup.js](js/laptop-mockup.js).

The codebase already names its token block "ORYZO design system" in a comment at [styles.css:2](css/styles.css#L2), and most values are centralized as CSS custom properties in `:root`. `scroll-story.css` is additive and reuses the same tokens rather than declaring its own.

---

## 1. Colors

### 1.1 Defined tokens (css/styles.css :root, lines 3–16)

| Token | Value | Apparent semantic role |
|---|---|---|
| `--color-warm-cream` | `#ffedd7` | Primary text-on-dark / background tint for glass surfaces |
| `--color-walnut-shadow` | `#100904` | Primary dark background (near-black, warm) |
| `--color-bark-brown` | `#7c1e1e` | Secondary accent / label text on light bg (identical value to `--color-brand-red`) |
| `--color-cork-border` | `#4a1f1f` | Body text color on light (case-detail) background |
| `--color-driftwood` | `#c99494` | Hover state color (links, tabs, buttons) |
| `--color-ember-accent` | `#ffcece` | **Defined but unused** — no reference anywhere in CSS |
| `--color-pure-black` | `#000000` | **Defined but unused** — no reference anywhere in CSS |
| `--color-brand-red` | `#7c1e1e` | Primary accent / active state (case tabs, About background) — duplicate value of `--color-bark-brown` |
| `--color-brand-red-soft` | `rgba(124, 30, 30, 0.42)` | **Defined but unused** — no reference anywhere in CSS |
| `--color-brand-red-hover` | `rgba(124, 30, 30, 0.65)` | **Defined but unused** — no reference anywhere in CSS |
| `--color-case-accent` | `#7d0000` | Secondary red accent — used for quotes, decision insights, metric labels; visually near-identical to `--color-brand-red` (#7c1e1e) but a distinct value |
| `--color-off-white` | `#ffffff` | Text/icon color on dark hero surfaces |
| `--color-image-stroke` | `rgba(16, 9, 4, 0.2)` | Hairline border around all case-study images |
| `--color-grey` | `#8c8c8c` | Muted caption text on light background |

**4 of 16 declared color tokens are never used anywhere in the codebase**: `--color-ember-accent`, `--color-pure-black`, `--color-brand-red-soft`, `--color-brand-red-hover`.

### 1.2 Colors visually similar but represented by different values

| Color A | Color B | Difference |
|---|---|---|
| `--color-brand-red` `#7c1e1e` | `--color-bark-brown` `#7c1e1e` | **Identical hex value**, two different token names — should be merged into one semantic token |
| `--color-brand-red` `#7c1e1e` | `--color-case-accent` `#7d0000` | Both used as "the red accent" across the site but are distinct values (one warmer/lighter, one darker/more saturated) — likely should be a single accent token, or an explicit `accent` / `accent-secondary` pair |
| `#fff` (hardcoded, [styles.css:774](css/styles.css#L774), [:785](css/styles.css#L785)) | `--color-off-white` `#ffffff` | Same color, written two different ways (hardcoded shorthand vs. token) |

### 1.3 Hardcoded (non-token) colors found in CSS

| Value | Location | Occurrences | Notes |
|---|---|---|---|
| `#fff` | `.about-heading h1`, `.about-lead` ([styles.css:774](css/styles.css#L774), [:785](css/styles.css#L785)) | 2 | Should use `--color-off-white` |
| `#e4e4e0` | `.hero__screen`, `.story__screen` ([styles.css:138](css/styles.css#L138), [scroll-story.css:229](css/scroll-story.css#L229)) | 2 | Placeholder/loading background for laptop-screen overlay; not tokenized anywhere |
| `rgba(255, 255, 255, 0.3)` | `.case-nav::before` | 1 | One-off white-alpha border, not shared with any token |
| `rgba(255, 255, 255, 0.35)` | `.hero-video__btn`, `.hero-video__indicator` borders | 2 | Repeated raw value, candidate for a token |
| `rgba(255, 255, 255, 0.5)` | `.hero-video__controls` border, `.glass-text-shadow` (via token) | 2 | |
| `rgba(255, 255, 255, 0.7)` | `.case-nav__label`, `.story__progress-hint` | 2 | Repeated "muted white text on dark" value |
| `rgba(255, 255, 255, 0.25)` | `.story__progress-line` | 1 | |
| `rgba(0, 0, 0, 0.15)` | `.hero-video__scrim` | 1 | Only pure-black-based rgba in the codebase — everything else dark uses `#100904`/`rgba(16, 9, 4, …)` |
| `rgba(16, 9, 4, 0.55)` | `.hero-video__controls` bg, `.story__mobile-laptop::before` gradient | 2 | `16, 9, 4` = `--color-walnut-shadow` unpacked into rgba (not expressed via the token, since CSS can't add alpha to a hex custom property directly) |
| `rgba(16, 9, 4, 0.9)` | `.video-lightbox__backdrop` | 1 | |
| `rgba(16, 9, 4, 0.2)` | `.story__progress.is-on-light .story__progress-line` | 1 | Duplicates `--color-image-stroke`'s exact value but not expressed via that token |
| `rgba(16, 9, 4, 0.35)` | `.story__closing-cue::before` | 1 | |
| `rgba(16, 9, 4, 0.4)` | `.story__closing-cue` (color) | 1 | |
| `rgba(16, 9, 4, 0)` | `.story__mobile-laptop::before` gradient stop | 1 | |
| `rgba(124, 30, 30, …)` (soft/hover) | Defined as tokens but unused | 0 | See §1.1 |

**Observation:** every dark rgba value in the file decomposes to `16, 9, 4` (i.e., `--color-walnut-shadow`) or `255, 255, 255` (i.e., `--color-off-white`) at varying alphas — this is a strong, consistent pattern, just not expressed as reusable alpha tokens (e.g. `--color-walnut-shadow-55`, `--color-off-white-35`).

### 1.4 Semantic grouping (inferred)

- **Background (dark):** `--color-walnut-shadow` (#100904) — hero, video lightbox, about-open state before red
- **Background (light):** `--color-off-white` (#ffffff) — case-detail sections, story flow sections
- **Background (accent):** `--color-brand-red` (#7c1e1e) — About panel background
- **Foreground/text (on dark):** `--color-warm-cream` (#ffedd7), `--color-off-white` (#ffffff)
- **Foreground/text (on light):** `--color-walnut-shadow` (headings), `--color-cork-border` (#4a1f1f, body copy)
- **Muted text:** `--color-grey` (#8c8c8c), `rgba(255,255,255,0.7)`, `rgba(255,255,255,0.55)` (inline, `.story__panel-number`)
- **Border:** `--color-image-stroke` (rgba(16,9,4,0.2)) for all image frames; `--color-cork-border` for hairline rules on light bg; `rgba(255,255,255,0.25–0.35)` for hairlines on dark bg
- **Accent/interactive:** `--color-driftwood` (#c99494, hover fill/text), `--color-brand-red` / `--color-case-accent` (active/emphasis)
- **Error/success:** **None found.** No error, success, warning, or form-validation states exist anywhere in the codebase (there are no forms).

### 1.5 Tokens vs. hardcoded — summary

Roughly **80% of color usage goes through CSS custom properties**; the remaining ~20% (mostly rgba decompositions of the two core dark/light colors, plus `#fff` and `#e4e4e0`) is hardcoded directly in rules. No color appears as a Tailwind-style utility or inline HTML/JS style — all color logic lives in the two CSS files.

---

## 2. Typography

### 2.1 Font families

| Token | Stack | Usage |
|---|---|---|
| `--font-display` | `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Default body font (set on `html, body`); all UI labels, nav, body copy, buttons |
| `--font-serif` | `'Cormorant Garamond', Georgia, 'Times New Roman', serif` | Display headlines only: name in intro, case titles, story flow headings, quotes |
| `--font-statement` | `'Bodoni Moda', 'Cormorant Garamond', Georgia, serif` | Goal-band principle statements (`.case-detail__principle` inside `.case-detail__row--goal`). Replaced Marcellus site-wide. |
| `--font-accent` | `'Schibsted Grotesk', var(--font-display)` | Body text inside `.case-detail__impact-item` (numbered problem/impact grids) and `.case-detail__row--key-decisions` — the onboarding case study's updated body-copy treatment, now shared by every case study's grid/list items that don't have their own case-specific override |
| `--font-caption` | `Arial, system-ui, sans-serif` | **Defined but unused** — no selector references it |

Loaded families come from Google Fonts via `<link>` in [index.html:9](index.html#L9): DM Sans (400/500/600/700), Cormorant Garamond (400/500/600 + italic 400), Bodoni Moda (400/600/700 + italic 400), Schibsted Grotesk (500). No local/self-hosted fonts.

### 2.2 Font weights

| Token | Value | Usage |
|---|---|---|
| `--font-weight-regular` | 400 | Body copy, captions, labels (most common — 14 uses) |
| `--font-weight-medium` | 500 | Headings, buttons, case titles (13 uses) |
| `--font-weight-semibold` | 600 | **Used exactly once** (`.case-detail__decision-heading`) |
| `--font-weight-bold` | 700 | Emphasis: nav tabs, kicker labels, principle quotes, subheads (5 uses) |

All font-weight usage goes through tokens — no hardcoded numeric weights found.

### 2.3 Font sizes

Two parallel systems coexist:

**A. Fixed-token scale** (defined in `:root`, used for a handful of specific roles):

| Token | Value | Line-height token |
|---|---|---|
| `--text-display` | 51px | `--leading-display: 0.9` |
| `--text-heading` | 41px | `--leading-heading: 0.9` |
| `--text-heading-sm` | 24px | `--leading-heading-sm: 1.09` |
| `--text-subheading` | 18px | `--leading-subheading: 1` |
| `--text-body` | 29px | `--leading-body: 1.26` |
| `--outcome-label-size` | `clamp(20px, 1.9vw, 36px)` | — |

Of these, only `--text-heading` and `--leading-heading` (used on `.case-detail__label`), `--leading-heading-sm` (used on `.case-detail__decision-heading`), `--leading-display` (used on `.about-open .intro__name`), and `--outcome-label-size` (`.story__panel-kicker`) are actually referenced in the stylesheets. **`--text-display`, `--text-heading-sm`, `--text-subheading`, `--text-body`, and `--leading-subheading`/`--leading-body` are declared but never consumed** — the fluid `clamp()` sizes below appear to have superseded them without cleanup.

**B. Ad-hoc fluid clamps** (the dominant pattern in practice — not tokenized): 19 distinct `clamp(min, preferred, max)` values are hardcoded throughout, e.g. `clamp(15px, 1.1vw, 20px)` (9 uses — the de facto "body" size), `clamp(14px, 1.05vw, 21px)` (3 uses), plus 16 more one-off clamps ranging from `clamp(13px, 0.95vw, 17px)` up to `clamp(40px, 6.5vw, 145px)`.

**C. Fixed pixel sizes** (hardcoded, no token): `12px` (9×), `14px` (6×), `13px` (5×), `24px` (2×), `18px` (2×), plus singles at `19px`, `16px`, `15px`, `11px`.

### 2.4 Duplicate / near-duplicate typography values

| Values | Where | Note |
|---|---|---|
| `clamp(15px, 1.1vw, 20px)` | Used identically across `.case-detail__columns p`, `.case-detail__bullets li`, `.case-detail__decision-body`, `.case-detail__overview-secondary`, `.case-detail__quote`, `.story__flow-body`, `.case-detail__reflection-body p`, `.story__flow-heading--plain`, `.story__panel-heading--plain` — this is a strong, consistent "body copy" size that should become a named token (e.g. `--text-body`, replacing the unused 29px one) |
| `clamp(14px, 1.05vw, 21px)` vs `clamp(15px, 1.1vw, 20px)` | `.case-card__desc`, `.story__panel-body`, `.story__panel-heading--plain` vs. the body clamp above | Nearly identical fluid ranges (1px apart at both ends) representing what reads as the same intended size — candidates to consolidate into one token |
| `12px` fixed vs. `13px` fixed | `.story__panel-number`, `.case-nav__label`, `.story__progress-*` (12px) vs. `.hero-video__indicator`, `.video-lightbox__indicator`, `.case-detail__quote cite` (13px) | Two near-identical "micro-label" sizes used inconsistently for the same UI role (small caption/indicator text) |
| Letter-spacing `-0.01em` vs `-0.02em` vs `-0.045em` | Headings across `.case-card__title` (-0.02em), `.case-detail__heading`/`.story__flow-heading`/`.story__panel-heading` (-0.01em), `.about-heading h1`/`.about-lead` (-0.045em) | Three different "tight heading tracking" values with no clear scale relationship — likely should converge to 2 tokens (e.g. a standard heading tracking and a display/hero tracking) |
| `letter-spacing: normal` used explicitly in 5 places | e.g. `.intro__name`... actually `.about-meta a`, `.case-nav__label`, `.case-detail__meta-label/value`, `.case-detail__decision-caption-label` | Explicit `normal` rather than omitting the property — harmless but inconsistent style; some of these (`.case-detail__decision-caption-label`) also set `letter-spacing: 0.02em` for the uppercase variant nearby, so the codebase already distinguishes "normal" vs. "wide/uppercase" tracking, just not via a token |

### 2.5 Text style / heading inventory

| Role | Selector | Font | Size | Weight | Transform |
|---|---|---|---|---|---|
| Hero name | `.intro__name` | serif | 24px (fixed) / `clamp(32px,5.5vw,86px)` when about-open | 400 | — |
| Hero role | `.intro__role` | display | 13px / 18px (about-open) | 400 | — |
| Case title | `.case-card__title` | serif | `clamp(40px,6.5vw,145px)` | 500 | uppercase |
| Case description | `.case-card__desc` | display | `clamp(14px,1.05vw,21px)` | 400 | — |
| Case-detail section label | `.case-detail__label` | display | 14px | 500 | uppercase — numbered `"01 / Section Name"` convention, shared by all three case studies |
| Case-detail heading (top of case) | `.case-detail__heading` | serif | `clamp(28px,4vw,56px)` | 500 | — |
| Intro sub-heading (per section) | `.case-detail__intro-heading` | serif (Cormorant Garamond) | `clamp(26px,3.6vw,52px)` | 400 | — matches `.case-detail__reflection-quote` |
| Decision/card heading | `.case-detail__decision-heading` | display | `clamp(15px,1.4vw,20px)` | 600 (only semibold use) | — |
| Impact-item heading (numbered problem/impact grids) | `.case-detail__impact-item .case-detail__decision-heading` | accent (Schibsted Grotesk) | `clamp(21px,2.3vw,30px)` | 500 | — |
| Impact-item body | `.case-detail__impact-item .case-detail__decision-body` | accent (Schibsted Grotesk) | `clamp(15px,1.35vw,18px)` | 400, 70% opacity | — |
| Principle/pull-quote | `.case-detail__principle` | display | `clamp(20px,2vw,32px)` | 700 | — |
| Principle/pull-quote (in a `.case-detail__row--goal` band) | `.case-detail__row--goal .case-detail__principle` | statement (Bodoni Moda) | `clamp(20px,2vw,32px)` | 400 | — |
| Story flow heading | `.story__flow-heading` | serif | `clamp(28px,3.2vw,48px)` | 400 (inherits) | — |
| Story panel heading | `.story__panel-heading` | serif | `clamp(18px,1.6vw,28px)` | 500 | — |
| About heading | `.about-heading h1` | display (inherits) | `clamp(26px,2.55vw,40px)` | 500 | — |

---

## 3. Spacing

### 3.1 Declared spacing tokens (`:root`)

```
--spacing-6:  6px      --spacing-24: 24px      --spacing-68: 68px
--spacing-8:  8px      --spacing-31: 31px      --spacing-96: 96px
--spacing-9:  9px      --spacing-48: 48px      --card-padding: 24px (= --spacing-24)
--spacing-10: 10px     --spacing-62: 62px      --element-gap: 18px (= --spacing-18)
--spacing-12: 12px
--spacing-14: 14px
--spacing-18: 18px
```

**`--spacing-9` and `--spacing-10` and `--spacing-14` are declared but never used anywhere.** `--card-padding` and `--element-gap` are also declared as aliases but never referenced — `--spacing-24`/`--spacing-18` are used directly instead everywhere a card/element gap occurs.

### 3.2 Apparent base scale

The used tokens (6, 8, 12, 18, 24, 31, 48, 62, 68, 96) don't fit one clean linear or geometric progression. Grouping by rough function:

| Tier | Values | Apparent role |
|---|---|---|
| **Micro** | 6px, 8px | Icon-to-label gaps, tight list gaps |
| **Small** | 12px | Standard internal component gap (very common — meta rows, decision blocks, metric gaps) |
| **Medium** | 18px | Standard "element gap" — bullets, columns, panel gaps, mobile section gaps |
| **Large** | 24px | Card padding, grid gaps, section padding on mobile, impact-metric gaps |
| **One-off** | 31px | Only used as `margin-top` to align evolution-row images/text (`--spacing-31`) — a purpose-built offset, not a scale step |
| **Section** | 48px | Left/right page gutter (`.side-nav`, `.about`, `.case-detail` padding) |
| **Section-lg** | 62px | Grid column-gap in nearly all 3-column case-detail rows |
| **Section-xl** | 68px | Vertical padding of `.case-detail` and `.story__flow-section` |
| **Section-xxl** | 96px | Gap between stacked decision blocks (`.case-detail__decisions`) |

A plausible **proposed scale** consolidating the used values (dropping the never-used 9/10/14 and keeping 31 as a documented exception):

```
--space-1: 6px
--space-2: 8px
--space-3: 12px
--space-4: 18px
--space-5: 24px
--space-6: 48px
--space-7: 62px
--space-8: 68px
--space-9: 96px
```

### 3.3 One-off / hardcoded spacing values (not tokenized)

| Value | Where | Occurrences | Role |
|---|---|---|---|
| `72px` gap | `.about-meta` | 1 | Gap between Email/LinkedIn links — no nearby token (68 or 96 would be the closest) |
| `10px` gap/margin | `.side-tab--about` (about-open gap), `about-lead` margin-left unit is vw not px | 2 | Close to `--spacing-8`/`--spacing-12` but not equal to either |
| `1px` gap | `.side-tab--about` default gap | 1 | Essentially "no gap" — likely intentional hairline stacking, not a scale value |
| `2px` | `.intro__name` margin-bottom, `.about-meta a` padding-bottom | 2 | Below the smallest token (6px) — sub-scale fine-tuning |
| `14px` padding-left | `.story__quote` | 1 | Between `--spacing-12` and `--spacing-18`; visually duplicates the effect of `--spacing-18` used for the identical role (`.case-detail__quote` padding-left) elsewhere — **same visual pattern (quote indent), two different values** |
| `16px` padding-left | `.story__panel-list li` | 1 | Same "bullet indent" role as `.case-detail__bullets li` which uses `--spacing-18` — another instance of the same pattern at a different value |
| `20px` padding-left | `.story__closing-cue` | 1 | |
| `190px` / `140px` margin-top | `.about-heading` (desktop / mobile) | 2 | Layout-specific vertical offset, not part of the spacing scale |
| `34px` / `24px` margin-top | `.about-lead` (desktop / mobile) | 2 | |
| `12px` margin (top, shorthand) | `.story__panel-list`, `.story__quote`, `.about-heading` region | multiple | Equal to `--spacing-12` in value but written as a literal `12px 0 0` rather than `var(--spacing-12) 0 0` |
| `8px`/`10px` margin-bottom on headings (`.story__panel-number`, `.story__panel-kicker`, `.story__panel-heading`, `.about-heading`) | scroll-story.css | ~6 | Equal to `--spacing-8`/close to `--spacing-10`(unused token) but written as literals |

**Pattern:** `scroll-story.css` (the newer file) tends to hardcode small spacing values as literals (`8px`, `10px`, `12px`, `14px`, `16px`, `20px`) even where an equal or near-equal token already exists in `:root` — `styles.css` is more consistently token-driven. This is the single biggest spacing inconsistency in the codebase.

### 3.4 Margins vs. padding vs. gap — same visual spacing, different mechanisms

- **Quote left-indent**: `.case-detail__quote` uses `padding-left: var(--spacing-18)` + `border-left`; `.story__quote` uses `padding-left: 14px` (hardcoded) + `border-left` — same component pattern, different implementation value.
- **List bullet indent**: `.case-detail__bullets li` uses `padding-left: var(--spacing-18)`; `.story__panel-list li` uses `padding-left: 16px` (hardcoded) — same pattern, different value again.
- **Section vertical rhythm**: `.case-detail` uses `padding: var(--spacing-68) … calc(var(--spacing-68)*2)`; `.story__flow-section` uses `padding: var(--spacing-68) var(--spacing-48)` — consistent on the token, inconsistent on which sides get the value.

---

## 4. Layout

### 4.1 Max content widths

| Value | Where |
|---|---|
| `1300px` | `.case-detail__inner` — the main content container's true max-width |
| `720px` | `.story__flow-section` |
| `640px` | `.case-detail__principle` |
| `620px` | `.case-detail__sequence-media` |
| `600px` | `.intro` (default, non-about state) |
| `520px` | `.case-detail__row-visual--sm` |
| `480px` (via `min(32vw, 480px)`) | `.about-portrait` |
| `420px` | `.case-detail__problem-visual img` |
| `320px` | `.case-detail__row-visual--compact`, `.case-detail__validation-visual`, mobile `.case-detail__validation-visual` |
| `70ch` / `60ch` | `.case-detail__reflection-body`/`.case-detail__row--evolution .decision-body`(70ch); `.case-detail__decision-body`, `.story__flow-body` (60ch) — text-measure caps, inconsistent between 60 and 70 for what reads as the same "body paragraph" role |
| `min(650px, 48vw)` / `min(680px, 51vw)` | `.about-heading` / `.about-lead` — two near-identical clamped widths for sibling elements |

No single global "page container" max-width exists — `.case-detail__inner` (1300px) is the closest thing to a site-wide content-width constant, but every other block defines its own ceiling independently.

### 4.2 Grid structure

The case-detail sections use a **3-column CSS grid** as their primary structural device:

```css
grid-template-columns: repeat(3, minmax(0, 1fr));
column-gap: var(--spacing-62);
```

- **Column 1**: section label (e.g. "Overview", "Problem", "Impact") — serif, uppercase, `--text-heading`
- **Columns 2–3**: content, either as one `grid-column: 2 / 4` spanning block or split across two independent tracks (used for before/after, quotes/missing, two-paragraph intros)
- A secondary **2-column sub-grid** (`repeat(2, minmax(0,1fr))`) appears nested inside column 2–4 spans for image/text pairs (`.case-detail__problem-pair`, `.case-detail__key-decision`, evolution rows)
- One absolutely-positioned exception: `.case-detail__meta-col--scope` is math-positioned at the grid's exact inter-track midpoint (`calc((100% + var(--spacing-62)) / 6)`) rather than occupying a grid track, documented inline as intentional.

Both the outer 3-col grid and the inner 2-col grid consistently use `var(--spacing-62)` as column-gap. Row-gap is less consistent: `var(--spacing-48)` for `.case-detail__row`, `var(--spacing-18)` for evolution/decision sub-grids.

### 4.3 Container padding / gutters

| Value | Where |
|---|---|
| `--spacing-48` (48px) | Primary desktop gutter: `.intro`, `.side-nav` left offset, `.case-nav` left offset, `.about` padding, `.case-detail` left padding, `.story__flow-section`/`.story__closing` horizontal padding |
| `--spacing-48 + 56px` (104px) | `.case-detail` **right** padding only — an asymmetric gutter, documented nowhere, presumably to clear the fixed progress-trail rail on the right edge |
| `--spacing-24` (24px) | Mobile gutter, replacing 48px at the 980px breakpoint consistently |

### 4.4 Breakpoints

Only two breakpoints exist across the entire site:

- **`max-width: 980px`** — the primary/only responsive breakpoint, switching hero from pinned-scroll to stacked static layout, collapsing all 3-col grids to 1 column, and swapping 48px gutters for 24px.
- **`max-width: 560px`** — a single micro-breakpoint that only resizes `.intro__name`/`.intro__role` further.

Plus two capability-based (not width-based) media features: `(hover: none)` (touch-device fallback for hero video controls) and `(prefers-reduced-motion: reduce)` (disables all scroll-linked animation, used twice — once in each CSS file).

No tablet-specific (e.g. 768px) or wide-desktop (e.g. 1440px+) breakpoints exist; the fluid `clamp()`/`vw` typography and layout is what carries the design between 980px and very large viewports instead of discrete breakpoints.

### 4.5 Alignment / section widths

Sections are full-bleed (`width: 100%` / `inset: 0`) at the outer level; all actual width constraints happen on inner content wrappers (`.case-detail__inner`, `.story__flow-section`, `.story__panel`), which are either grid-based (case-detail) or `max-width` + `margin: 0 auto` centered blocks (story flow sections).

---

## 5. Components

### 5.1 Buttons

Two visually distinct button "families," both borderless/backgroundless by default (`button { border:none; background:none; }` global reset):

**A. Icon buttons** (`.hero-video__btn`, `.hero-video__arrow`, `.video-lightbox__close`)
- Fixed square: `32px` (hero controls), `36px` (lightbox close)
- No border-radius (0px everywhere — see §6)
- Border-left hairline between adjacent buttons in a row (`1px solid rgba(255,255,255,0.35)`)
- Hover: background fill `--color-driftwood`, or color-only change for the lightbox close
- Disabled: `opacity: 0.3`, `pointer-events: none` (only on `.hero-video__arrow`)
- Icons are hand-drawn via border/pseudo-element tricks (CSS triangles, crossed lines) rather than an icon font/SVG sprite — consistent, deliberate pattern noted in a code comment

**B. Case-tab buttons** (`.case-tab`, the "01 02 03" case switcher)
- Fixed square: `50px` desktop / `44px` mobile
- `border: 1px solid var(--color-off-white)`, transparent background
- Hover: fills `--color-driftwood`
- Active (`.is-active`): fills `--color-brand-red`
- Font: display, 24px, medium weight

Both families use the same `transition: background 0.2s ease, color 0.2s ease[, border-color 0.2s ease]` timing.

### 5.2 Links

- **Nav/tab links** (`.side-tab`): uppercase, bold, 16px, letter-spacing 0.02em, hover → `--color-driftwood`
- **About meta links** (`.about-meta a`): uppercase, medium, 14px, `opacity: 0.7`, `border-bottom: 1px solid`, no visible hover state defined (opacity change on hover not implemented — a gap, see §Inconsistencies)
- **Global link reset**: `text-decoration: none; color: inherit;` — every link's actual color comes from context, none from a dedicated "link color" token

### 5.3 Cards

No single ".card" component class exists; several structures serve a "card" role without sharing a name:
- **Metric/impact items** (`.case-detail__metric`, `.case-detail__impact-item`): no visible container, just a `border-top` rule + stacked flex content — a "rule-topped" pseudo-card
- **Compare items** (`.case-detail__compare-item`, `.compare-media`): image wrapped in a bordered `div` (`1px solid var(--color-image-stroke)`) + caption below
- **Key-decision media** (`.case-detail__key-decision-media`): same bordered-image pattern, background `--color-off-white`

All "card" borders use the same 1px hairline weight and either `--color-image-stroke` or `--color-cork-border`, and none carry a border-radius, shadow, or elevation — the entire card language is flat/bordered, never shadowed.

### 5.4 Navigation

- **Primary nav** (`.side-nav`): single "About" link, fixed top-left, converts into a "Close ✕" affordance when About is open (label swap via JS, arrow rotates via CSS)
- **Case nav** (`.case-nav`, vertical "01/02/03" rail): fixed position, vertical rule (`::before`) + rotated vertical label + button list
- **Progress trail** (`.story__progress`): a second, independent fixed-position vertical rail on the opposite (right) edge, tracking scroll position with a moving marker dot — conceptually a "scroll progress nav," styled with the same hairline-rule + rotated-label language as `.case-nav`, but implemented as an entirely separate component with its own hardcoded values rather than sharing a mixin/class

### 5.5 Tags / chips

`CASES` data in [main.js:5](js/main.js#L5) defines a `tags` array (`['B2B SaaS', 'Climate Tech']`) per case, but **no markup or CSS renders these tags anywhere** — the data exists but the visual chip component was either removed or never built. This is worth flagging to the user directly, since it may be dead data or a missing feature.

### 5.6 Image containers

Extremely consistent pattern: nearly every content image in `.case-detail` gets:
```css
display: block; width: 100%; height: auto;
border: 1px solid var(--color-image-stroke);
```
This appears 7+ times verbatim (`.decision-image`, `.problem-map-img`, `.problem-visual img`, `.row-visual img`, `.validation-visual img`, `.compare-media img`, `.key-decision-media img`) and is the closest thing to a true reusable "Image" component in the system — a strong candidate for formalization as `.img-frame` or similar.

### 5.7 Section headers

`.case-detail__label` (display font, uppercase, 14px, medium weight) is used as the column-1 label for every section, in all three case studies, following one shared numbered convention: `"01 / Overview"`, `"02 / Problem"`, etc. — each case study numbers its own rows independently. This was normalized site-wide from onboarding's (case 3) original numbered-label pattern; case 1 (Configurator) previously used a separate unnumbered `.case-detail__eyebrow` class, now removed in favor of the shared label.

### 5.8 Case study elements

- **Meta row** (Timeline/Scope/Team): 3-col grid, label (14px/regular/dark) + value (14px/regular/`--color-cork-border`) stacked pairs
- **Decision blocks**: heading (`.decision-heading`, 600 weight by default) + body (`.decision-body`) + optional image, repeated for Evolution/Approach/Key-Decisions sections with only grid-column overrides differing. Inside `.case-detail__impact-item` (numbered problem/impact grids), heading and body instead take the shared `--font-accent` (Schibsted Grotesk) treatment — larger, looser heading + 70%-opacity body — unless a case study defines its own more specific override (case 1's Impact section keeps its original DM Sans/grey treatment).
- **Goal band** (`.case-detail__row--goal`): full-bleed accent-color band with a label + principle statement (in `--font-statement`) on the left and a `.case-detail__goal-grid` of rule-topped `.case-detail__goal-item`s on the right. Shared component, used by case 2's "Hypothesis & Constraints" and case 3's "Goal" row.
- **Key decisions** (`.case-detail__row--key-decisions`): self-contained, full-bleed-breakout section with alternating text/image `.case-detail__key-decision` blocks (rounded bordered media) and an optional before/after `.case-detail__key-decision-compare` pair with pill badges. Currently used by case 3's Approach row; written as a shared, ID-independent component so future case studies can reuse it directly.
- **Compare (before/after)**: image + caption pairs via `.case-detail__key-decision-compare` / `.case-detail__compare-*`, no longer scoped to a specific case ID.
- **Metrics**: large serif number (`clamp(36px,4vw,64px)`) + uppercase small label, used for Impact sections.

### 5.9 Footer

Case 1 (Configurator) has a footer (`.case-detail__footer`): a hairline rule, Email/LinkedIn links, and a "next case study" link. Cases 2 and 3 still end at their last row with no closing element — an inconsistency worth resolving if a footer is meant to be a shared pattern.

### 5.10 Hero / video component

A rich compound component (hero photo/video/screen-overlay + hover scrim + transport controls + expand-to-lightbox), documented in detail via code comments — the most heavily commented section of the CSS, suggesting past iteration/fragility here. Its icons, control bar, and lightbox share timing (`0.18s`–`0.2s ease`) and color (`--color-off-white`, hover → `--color-driftwood`) with the rest of the interactive-control language.

---

## 6. Borders / Radius / Effects

### 6.1 Border widths

Only two widths used anywhere: **1px** (near-universal — hairlines, image frames, dividers) and **2px** (used exactly twice: `.video-lightbox__content` border, `.case-detail__quote`/`.story__quote` left-accent border). No 3px+ border exists.

### 6.2 Border styles

`solid` everywhere except one deliberate exception: `.case-detail__decision-image--missing` uses `1px dashed` to visually flag a placeholder/missing-asset state — a nice existing convention (dashed = "not real content yet") worth preserving as a token.

### 6.3 Border colors

- `var(--color-image-stroke)` — all content-image frames
- `var(--color-off-white)` — case-tab default border (dark-background context)
- `var(--color-case-accent)` — quote left-accent border
- `var(--color-cork-border)` — metric/stat-list top rules, dashed-missing border
- `currentColor` — all hand-drawn icon shapes (chevrons, expand corners)
- Raw `rgba(255,255,255, 0.3/0.35/0.5)` — dark-surface hairlines (case-nav rule, hero-video control dividers) — not tokenized (see §1.3)

### 6.4 Border radius

**Every radius token in `:root` is explicitly set to `0px`**:
```css
--radius-cards: 0px;
--radius-inputs: 0px;
--radius-buttons-pill: 0px;
--radius-buttons-outlined: 0px;
--radius-full: 0px;
```
This is a deliberate, site-wide "hard-edged" visual language — confirmed by the actual CSS, where the only two `border-radius` uses in the whole codebase are:
1. `border-radius: inherit` (`.story__screen-video`, inheriting from its parent)
2. A **dynamically computed** radius in JS (`Math.max(3, rect.width * 0.015)`, [main.js:97](js/main.js#L97), [scroll-story.js:453](js/scroll-story.js#L453)) applied inline to the laptop-screen overlay only, to match the rounded corner of the physical laptop bezel in the photo — the one intentional exception to the otherwise-universal 0-radius rule, and it's necessarily a runtime value (dependent on photo geometry) rather than a fixed token.

None of the five declared radius tokens are actually referenced by class name anywhere in either CSS file — they're set for documentation/intent ("we've decided radius is 0") rather than consumed via `var()`, since 0 is also just CSS's default.

### 6.5 Shadows

**None.** No `box-shadow` rule exists anywhere in the codebase. Depth/separation is communicated entirely through borders, opacity, and z-index layering, never elevation.

### 6.6 Blur

- `--glass-blur: 40px` is declared but **never applied** — no `backdrop-filter` or `filter: blur()` rule exists anywhere. The "glass surfaces" token group (`--glass-bg`, `--glass-border`, `--glass-hover`, `--glass-blur`, `--glass-text-shadow`) appears to be **entirely vestigial** — none of these five tokens are referenced by any selector in either stylesheet.

### 6.7 Opacity (used as a real, load-bearing effect — unlike blur)

Opacity is the primary state-communication mechanism site-wide: `0`/`1` toggles for show/hide-with-transition (`.is-visible` pattern, ~15 components), plus muted-value opacities used as a text-emphasis device: `0.7` (role text, about-meta links, muted labels), `0.55` (panel numbers), `0.65` (hover on progress-top), `0.3` (disabled arrow), `0.6`/`0.7` (touch-mode scrim/controls fallback). No single canonical "muted" opacity value — 0.55/0.6/0.65/0.7 all appear for what is functionally the same "de-emphasized but present" role.

---

## 7. Motion

### 7.1 Durations in use

| Duration | Occurrences | Typical use |
|---|---|---|
| 0.18s | 2 | Fast hover feedback (video scrim/controls) |
| 0.2s | ~8 | Standard hover/color transitions (buttons, tabs, close icon) |
| 0.25s | 2 | Hero photo/video opacity crossfade |
| 0.3s | 5 | Nav show/hide, arrow/gap morphs (About open state) |
| 0.35s | 2 | Hero screen fade-in, teaser line |
| 0.4s | ~9 | Most common "content reveal" duration — panel blocks, progress trail, closing cue color, about-panel overlay |
| 0.5s | ~5 | Slower reveals — story panel-block, mobile-block, marker travel, intro font-size morph |
| 0.6s | 2 | Slowest — flow-section and closing-cue scroll-reveal |

**No easing curve other than the keyword `ease` is used anywhere** — no cubic-bezier, no `ease-in-out` vs `ease-out` distinction, no spring/bounce. Every transition in both files uses the browser-default `ease` timing function exclusively.

### 7.2 Repeated animation patterns

- **Fade + rise reveal** (`opacity 0 → 1` + `transform: translateY(Npx) → translateY(0)`): the dominant scroll-reveal pattern, used with N ranging inconsistently across 6px, 12px, 14px, 16px, 24px depending on component (`.story__caption` 6px, `.story__progress-marker`-adjacent 14px, `.story__mobile-block` 16px, `.story__flow-section`/`.story__closing-cue` 24px/12px) — same pattern, no shared distance token.
- **Hover color/background swap**: `transition: background 0.2s ease, color 0.2s ease` — consistent across all button-like elements.
- **Visibility handoff**: `opacity` + `visibility` (with a delayed `visibility` via `transition-delay`, e.g. `.about` closing) to keep hidden elements out of the tab order without `display:none` breaking the fade.
- **`prefers-reduced-motion`**: handled twice, independently, in each CSS file (`styles.css` for the video lightbox; `scroll-story.css` for the whole pinned-scroll mechanism) — logic is not duplicated in content, but is a second, separate media-query block rather than one shared one, since they gate different features.

---

## 8. Design Tokens — recommendations

### 8.1 Tokens that already exist and work well (keep)
```
--color-warm-cream, --color-walnut-shadow, --color-cork-border, --color-driftwood,
--color-case-accent, --color-off-white, --color-image-stroke, --color-grey
--font-display, --font-serif
--font-weight-regular/medium/semibold/bold
--spacing-6/8/12/18/24/48/62/68/96
--radius-* (all 0 — keep as an explicit "flat" declaration)
```

### 8.2 Tokens to add (currently hardcoded/repeated raw values)
```
--color-bg-dark-55        /* rgba(16,9,4,0.55) — controls bg, mobile scrim gradient */
--color-bg-dark-90        /* rgba(16,9,4,0.9)  — lightbox backdrop */
--color-border-on-dark    /* rgba(255,255,255,0.35) — hairlines on dark surfaces */
--color-text-muted-on-dark /* rgba(255,255,255,0.7) — case-nav label, progress hint */
--text-body               /* clamp(15px, 1.1vw, 20px) — the de facto body-copy size, used 9x */
--text-caption            /* 12px or 13px — pick one, currently split */
--space-9-off             /* 9px */ — consider deprecating, unused
--radius-screen-overlay   /* keep as computed, but document as the one exception */
--duration-fast   : 0.2s
--duration-base   : 0.4s
--duration-slow   : 0.6s
--ease-standard   : ease
--reveal-distance : 16px  /* consolidate the 6/12/14/16/24px translateY reveal offsets */
```

### 8.3 Tokens to remove (declared, zero usages found)
```
--color-ember-accent, --color-pure-black, --color-brand-red-soft, --color-brand-red-hover
--font-caption
--text-display, --text-heading-sm, --text-subheading, --text-body, --leading-subheading, --leading-body
--spacing-9, --spacing-10, --spacing-14, --card-padding, --element-gap
--glass-bg, --glass-border, --glass-hover, --glass-blur, --glass-text-shadow
```

### 8.4 Tokens to merge (duplicates)
```
--color-brand-red  ==  --color-bark-brown   (#7c1e1e, identical value — pick one name)
```

---

## One-off values

| Value | Category | Where it is used | Occurrences | Intentional or suspicious |
|---|---|---|---|---|
| `72px` | Spacing (gap) | `.about-meta` | 1 | Suspicious — no scale value nearby (68 or 96 both plausible neighbors) |
| `9px` height (pause icon) | Sizing | `.hero-video__icon--pause` | 1 | Intentional — matches a specific 9×11 hand-drawn icon geometry |
| `31.25%` margin-top | Layout | `.case-detail__problem-text` | 1 | Intentional — documented in a code comment as an exact image-aspect-ratio midline calculation |
| `33.08vh` / `5.45vh` / `34vh` | Layout (vertical anchor) | `.case-nav`, `.case-card__bottom`, `.story__progress`/`.story__panel` | several | Intentional — precise viewport-relative anchors tying multiple fixed elements to the same visual rhythm, but expressed as raw numbers with no shared token |
| `#e4e4e0` | Color | `.hero__screen`, `.story__screen` placeholder bg | 2 | Intentional (neutral placeholder) but not tokenized |
| `14px` padding-left | Spacing | `.story__quote` | 1 | Suspicious — duplicates the role of `--spacing-18` used by `.case-detail__quote` for the same visual pattern |
| `16px` padding-left | Spacing | `.story__panel-list li` | 1 | Suspicious — same bullet-indent role as `.case-detail__bullets li`'s `--spacing-18` |
| `1px` gap | Spacing | `.side-tab--about` default state | 1 | Intentional (deliberately near-zero, morphs to 10px on open) |
| `2px` | Spacing | `.intro__name` margin-bottom, `.about-meta a` padding-bottom | 2 | Intentional fine-tuning, below scale |
| `110px` height | Sizing | `.story__mobile-laptop::before` scrim gradient | 1 | Intentional, tuned to a specific photo's proportions |
| `#fff` | Color | `.about-heading h1`, `.about-lead` | 2 | Suspicious — should be `--color-off-white` |
| `70ch` vs `60ch` | Sizing (measure) | reflection body / evolution body (70ch) vs. decision/flow body (60ch) | mixed | Suspicious — same "readable paragraph" role, two values |
| `letter-spacing: -0.045em` | Typography | `.about-heading h1`, `.about-lead` | 2 | Suspicious — a third, more extreme tracking value alongside -0.01em/-0.02em used elsewhere for headings |

## Potential inconsistencies

| Location | Current value | Expected/common value | Reason it may be inconsistent | Severity |
|---|---|---|---|---|
| `.about-heading h1`, `.about-lead` ([styles.css:774](css/styles.css#L774),[:785](css/styles.css#L785)) | `color: #fff` | `color: var(--color-off-white)` | Same color, bypasses the token system | Low |
| `--color-brand-red` vs `--color-bark-brown` | Both `#7c1e1e` | One token | Two names for the same value — will cause confusion for future edits (changing one won't change the other) | Medium |
| `--color-brand-red` (#7c1e1e) vs `--color-case-accent` (#7d0000) | Two distinct reds used interchangeably as "the accent" | A single `--color-accent` | No clear rule for when to use which; both read as "brand red" in context | Medium |
| `.story__quote` padding-left: `14px` vs `.case-detail__quote` padding-left: `var(--spacing-18)` | Same "quote indent" component, different values | Both `var(--spacing-18)` | `scroll-story.css` hardcodes a near-token value instead of reusing the existing token | Medium |
| `.story__panel-list li` padding-left: `16px` vs `.case-detail__bullets li` padding-left: `var(--spacing-18)` | Same "bullet indent" role, different values | Both `var(--spacing-18)` | Same root cause as above | Medium |
| `--color-ember-accent`, `--color-pure-black`, `--color-brand-red-soft`, `--color-brand-red-hover`, `--font-caption`, `--glass-*` (5 tokens), `--text-display`/`--text-heading-sm`/`--text-subheading`/`--text-body`, `--spacing-9`/`--spacing-10`/`--spacing-14`, `--card-padding`, `--element-gap` | Declared in `:root`, zero usages | Either used or removed | Dead tokens bloat the source of truth and mislead anyone formalizing the system into thinking they're load-bearing | Medium |
| `--radius-cards`/`--radius-inputs`/`--radius-buttons-pill`/`--radius-buttons-outlined`/`--radius-full` | All `0px`, none referenced via `var()` by any selector | Either apply them or drop the per-component split | Five separate "radius" tokens exist for a system that visually has exactly one radius value (zero) everywhere except one JS-computed exception | Low |
| Body-copy font-size: `clamp(15px, 1.1vw, 20px)` (9 uses) vs `clamp(14px, 1.05vw, 21px)` (3 uses) | Two near-identical fluid ranges for what reads as the same "paragraph" role | One `--text-body` token | No documented rule distinguishes when each applies (context: card/hero description vs. case-detail body) | Medium |
| Micro-label size: `12px` (9 uses) vs `13px` (5 uses) | Same "small caption/indicator" role split across two sizes | One `--text-caption` token | E.g. `.case-nav__label` (12px) and `.hero-video__indicator` (13px) sit in visually adjacent UI regions but differ by 1px with no apparent reason | Low |
| Heading letter-spacing: `-0.01em` (7×) vs `-0.02em` (1×, `.case-card__title`) vs `-0.045em` (2×, About) | Three distinct "tight heading" tracking values | Two tokens: standard heading + hero/display | The -0.02em and -0.045em cases look like one-off tuning rather than a deliberate three-tier system | Low |
| Muted/de-emphasized opacity: `0.55`, `0.6`, `0.65`, `0.7` used across different components for what is contextually "secondary text" | Multiple close values | One `--opacity-muted` token (e.g. 0.7) | No visual rationale documented for why role-text uses 0.7 but panel-number uses 0.55 | Low |
| `rgba(16, 9, 4, 0.2)` used raw in `.story__progress.is-on-light .story__progress-line` | Duplicates `--color-image-stroke`'s exact value | `var(--color-image-stroke)` | The token exists with this exact value already but isn't reused here | Low |
| `.about-meta a` has no `:hover` state defined | Static `opacity: 0.7` always | A hover/focus state (opacity → 1, or underline strengthen) | Every other interactive element in the system (nav tabs, case tabs, buttons) has an explicit hover treatment; this link is the one exception, likely an oversight | Medium |
| `tags` array in `CASES` (main.js) never rendered | Dead data | Either render as chips or remove from the data model | A "tags/chips" component seems to have been planned/removed but the data source remains, which could confuse future maintenance | Low |
| `.case-detail` right padding: `calc(var(--spacing-48) + 56px)` (asymmetric vs. left `var(--spacing-48)`) | One-off asymmetric gutter, undocumented | A named token (e.g. `--gutter-right-with-rail`) or a comment | Silently diverges from the left gutter with no inline explanation of the extra 56px (presumably clearance for `.story__progress`, but not stated) | Low |
| No focus-visible styling anywhere (only `:focus-within` on `.hero-video__controls`) | No `:focus` / `:focus-visible` outline overrides found on any link, button, or tab | Visible keyboard-focus indicator per component | Keyboard users get only the browser's default outline (if not suppressed) — worth auditing for accessibility, since buttons have `cursor: pointer` but no custom focus ring to match the hover language | Medium |

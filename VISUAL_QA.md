# Visual QA

Method: the live site was driven with Playwright (Chromium) at 1440, 1280, 1024, 768, 390, and 375px, covering the homepage/hero for all 3 cases, all 3 full case-detail pages, the About panel, hover states, and the scroll-driven pin-to-cover transition. Findings below are drawn from that rendered output, not from the CSS source — every item describes what a viewer actually sees.

## Overall assessment

The static states of this site are genuinely accomplished: the editorial type system, the 62px grid rhythm, the consistent image-frame treatment, and the case-study structure all read as one coherent, confident product across all three case studies and the About panel. Where it falls short is in the *dynamic* moments — the parts that only appear when you interact with it rather than look at a screenshot of it. The hero's case-switcher collides with its own screen-mockup content at common laptop widths, the About panel's fixed header overlaps its own body copy when scrolled on a phone, and the scroll-driven "hero rises to reveal case study" transition has an unfinished-looking hard seam partway through. None of these break the site, but they're exactly the kind of thing a visitor notices in the first ten seconds — the parts of the experience that are supposed to feel effortless. The fixes are narrow and don't touch the editorial design at all.

## Critical issues

**1. Case-switcher tabs collide with the laptop-mockup screen content at 1024–1280px, for Cases 1 and 2**
- **Location:** Hero, `.case-nav` (the "01 / 02 / 03" tabs), Case 1 (Configurator) and Case 2 (Portfolio Overview)
- **Viewport:** 1024px and 1280px (not present at 1440px+, not present below 980px, not present on Case 3)
- **What's wrong:** The fixed-position case-number tabs sit directly on top of the laptop/monitor mockup's on-screen UI at this width range. Because the inactive tabs (02, 03) are transparent/outline-only, the mockup's own sidebar text ("Konfigurator", "Portfolios", "Immobilien") and a live map thumbnail visibly show through and around them — real product-screenshot text bleeding through the case-switcher's own numbers. At 1024px it's worst: the "01" and "03" boxes sit squarely on top of a Berlin map thumbnail with pins showing through the number.
- **Why it matters:** This is the first thing a visitor sees on the site, and it looks like broken CSS, not an intentional layout — two unrelated UI layers visibly fighting for the same pixels.
- **Suggested fix:** Give the case-nav tabs an opaque or semi-opaque backing (matching the existing dark scrim/backdrop language already used elsewhere, e.g. `.hero-video__controls`'s dark background) so they're never see-through, regardless of what's behind them; or clamp the mockup's rendered size/position at this breakpoint so it can't reach as far left.
- **Priority:** Critical

**2. About panel's fixed header overlaps its own scrolled content on mobile**
- **Location:** About panel (`.about`), the fixed name/role header and "Close" button
- **Viewport:** 390px and 375px
- **What's wrong:** On mobile, the About panel's content scrolls internally (it's taller than the viewport), but the "Anna Iarinovskaia / Digital Product Designer" header and the "Close ✕" button are fixed to the viewport, not to the panel's own scroll position. Scrolling down to reach the lead paragraph and the Email/LinkedIn links causes the header text to visually sit on top of the scrolled paragraph — "Anna Iarinovskaia" prints directly over "focused on making complex...", and "Digital Product Designer" over the next line, both rendered as illegible overlapping text.
- **Why it matters:** This happens on the exact path a mobile visitor takes to find contact info — read the bio, keep scrolling, get the links. Legible text becomes a garbled double-exposure right in the middle of that path.
- **Suggested fix:** Either hide/fade the fixed header once `.about` is open on mobile (the same way it already hides via `body.nav-hidden` elsewhere in the site), or move the name/role into the scrolling content itself for the mobile layout so it scrolls away with everything else instead of staying pinned over it.
- **Priority:** Critical

## High priority

**3. Inactive case-switcher tabs become very low-contrast or invisible on mobile**
- **Location:** Hero, `.case-nav` tabs (inactive state: white 1px border, transparent fill)
- **Viewport:** 390px / 375px, worst on Case 2
- **What's wrong:** On mobile the tab row sits directly over the bottom portion of the hero photo. Where that photo happens to be light or white (Case 2's mockup shows a white dashboard panel right behind the tabs), a white-bordered transparent box on a white background is functionally invisible — "01" and "03" disappear almost entirely, leaving only the active red tab visible. Case 1 and Case 3 fare a little better (the photo behind them has enough texture/shading to keep a faint edge visible) but the contrast is still marginal in both.
- **Why it matters:** Two of the three ways to switch case studies become nearly impossible to see, purely as a side effect of which photo happens to be playing behind them — the same component is reliable in some cases and broken in others.
- **Suggested fix:** Give the tab's border/label an always-visible treatment independent of the photo behind it — a subtle drop shadow, a small dark backing, or a semi-opaque scrim behind the whole tab row (consistent with the dark scrims already used for the hero video controls).
- **Priority:** High

**4. Hard, untreated seam during the hero-to-case-study scroll transition**
- **Location:** The pin-and-cover handoff between `.hero` and `.case-detail` (all 3 case studies)
- **Viewport:** Reproduced at 1440px; mechanism is width-independent so likely present at all desktop widths
- **What's wrong:** Partway through the scroll that reveals the case-detail content, the case-detail panel's rising edge cuts straight across the hero photo with a flat, untreated line — no shadow, gradient, or blur softens it. For a moment the mockup image looks like it's been sliced in half by a sheet of white paper, before the reveal completes and the hero disappears entirely. Both the start state (hero, full-bleed) and end state (case-detail, fully covering) look intentional and polished; it's specifically the frame in between that looks unfinished.
- **Why it matters:** This is a deliberate, custom-built scroll effect — clearly something the designer invested real effort in — and the one moment that doesn't match that level of polish is the one moment every visitor scrolling down the page is guaranteed to pass through.
- **Suggested fix:** Add a soft shadow or short gradient fade along the top edge of `.case-detail` so the rising panel reads as sliding over the photo rather than guillotining it.
- **Priority:** High

**5. Three-item Impact/Reflection grids leave a large, asymmetric empty gap**
- **Location:** `.case-detail__impact-grid`, in the Impact section of Case 1, the Reflection section of Case 2, and the Impact section of Case 3
- **Viewport:** ≥980px (the grid is 2 columns at desktop; it collapses to 1 column on mobile, where this issue doesn't occur)
- **What's wrong:** Each of these three sections has exactly three takeaway items. In a fixed 2-column grid, that means item 3 sits alone on its own row, flush left, with a wide empty block of white space beside it where a fourth item would go. It happens identically in all three case studies, so it reads less like an accident and more like the grid pattern simply wasn't checked against a 3-item case — but it still leaves a conspicuous, unbalanced hole at the close of every single case study, right where the reader's takeaway should land.
- **Why it matters:** It's the last thing a reader sees before moving to the next case study, and in all three cases it ends on a lopsided, half-empty row rather than a settled, resolved layout.
- **Suggested fix:** For exactly three items, either let the third span both columns' width, center it, or switch this specific grid to a 3-column layout when there are 3 items (it already does something similar correctly for the 4-item Problem grid in Case 3, which fills a clean 2×2).
- **Priority:** High

## Medium priority

**6. Cramped line-wrapping in the 3-column grid at 1024px**
- **Location:** All case-detail body copy inside the 3-column grid (Overview, Problem, Research, etc.)
- **Viewport:** 1024px
- **What's wrong:** At 1024px the two content columns narrow enough that body paragraphs wrap after roughly 6–8 words per line, noticeably choppier than the comfortable, magazine-style measure at 1440px. Nothing overlaps or breaks, but the reading rhythm gets denser right at a very common tablet-landscape/small-laptop width.
- **Why it matters:** 1024px isn't a rare edge case — it's a standard iPad-landscape and small-laptop width — so a meaningful slice of visitors get the choppiest version of the site's longest-form reading experience.
- **Suggested fix:** Consider a slightly wider column allowance or a reduced side gutter specifically in the 1000–1150px range, or let single paragraphs span more than one grid track at this width.
- **Priority:** Medium

## Low priority

**7. Hero photo/screen-mockup crop leaves noticeably less "breathing room" around the case title on some cases than others at mid-desktop widths**
- **Location:** Hero, comparing Case 1/2 (mockup extends close to the left edge at 1024–1280px) vs. Case 3 (mockup sits further right, more background visible)
- **Viewport:** 1024–1280px
- **What's wrong:** This is the same underlying cause as Critical issue #1, but even where it doesn't reach outright collision, Case 1 and 2's mockups sit noticeably tighter to the left UI column than Case 3's, giving the three cases a slightly different amount of visual "air" around the case-switcher at this width range.
- **Why it matters:** Minor — most visitors won't consciously notice, but it's part of why Case 3's hero feels a touch more composed than 1 and 2's at this specific width.
- **Suggested fix:** Once #1 is fixed, re-check whether the same size/position clamp gives all three cases comparable clearance.
- **Priority:** Low

## Responsive issues

**1440px / 1280px** — Clean. Full 3-column grid, comfortable measure, no overflow, hero composition well balanced.

**1280px** — Case-nav/mockup collision (Critical #1) already visible here, milder than at 1024px but present on Cases 1 and 2.

**1024px** — Case-nav/mockup collision at its worst (Critical #1). 3-column grid text measure noticeably cramped (Medium #6). Otherwise structurally sound — no overflow, no broken grids.

**768px** — This is the site's mobile-layout breakpoint (<980px triggers the stacked layout), so case-nav becomes a static row and the collision issue disappears entirely. The hero's large intro name/role text is not reduced at this width (that only happens below 560px), which pairs a big serif nameplate with the otherwise-condensed mobile layout — the combination reads fine in practice, not flagged as an issue, but it's worth knowing this is a real "in-between" state a tablet-portrait visitor will actually see.

**390px / 375px** — Structurally solid (single-column stacking, no horizontal overflow, no console errors) but this is where both the About-panel header overlap (Critical #2) and the invisible case-nav tabs (High #3) actually surface. The two viewports behave identically to each other.

## Interaction issues

**Case-switcher tabs (`.case-tab`)** — Hover (fills driftwood) and active (fills brand red) states both work correctly and read consistently with the rest of the site's hover language. The functional problem isn't the interaction itself but the two visibility bugs above (Critical #1, High #3) that affect this same component.

**Hero video controls (play/pause/expand/prev/next)** — Hover reveal, pause icon, and expand-to-lightbox all worked correctly in testing, positioned precisely over the mockup screen with no misalignment.

**About link hover (`.about-meta a`)** — Works correctly: resting state is a dimmed white, hover shifts cleanly to the driftwood accent color, consistent with the rest of the site's interactive language. (This was recently added — confirmed functioning as intended.)

**Side nav / About toggle** — Opens and closes correctly, animates smoothly, arrow rotates as documented. On mobile this is the interaction that exposes the header-overlap bug (Critical #2) once the visitor scrolls the opened panel.

**Scroll-driven reveal (hero → case-detail)** — Functions correctly start-to-finish (nothing gets stuck, no flicker, no failure to complete), but the visual quality of the transition itself dips at the midpoint (High #4).

## Cross-page consistency

- **Homepage vs. case studies:** These feel like one product. Typography, the 62px grid, the image-frame treatment, and the section-label pattern ("OVERVIEW", "PROBLEM", "RESEARCH"...) are applied with real discipline across all three case studies — nothing here reads as a bolted-on afterthought.
- **All three case studies vs. each other:** Consistent structure and rhythm throughout. The differing hero mockup type (a desktop monitor for Case 1, a laptop for Cases 2 and 3) is a deliberate, appropriate choice reflecting the real products being shown, not an inconsistency.
- **About panel vs. the rest of the site:** Its bold red full-bleed background is a deliberate departure from the site's otherwise dark/light case-study palette — this reads as an intentional punctuation mark (a "reveal" moment when you open it), not a mismatch.
- **Systemic vs. accidental:** Worth noting explicitly — the Impact/Reflection grid gap (High #5) and the hero mockup collision (Critical #1) each appear identically across the cases they affect. Nothing in this review looked like a one-off, accidentally-different section; the issues found are consistent patterns repeating across the site, which makes them easier to fix once, everywhere.
- **Where the implementation undersells the design intent:** The scroll transition (High #4) and the hero's dynamic screen overlay (Critical #1, High #3) are clearly the most ambitious pieces of engineering on the site — and the only places where the polish visibly dips below the bar the rest of the site sets for itself.

## Recommended fixes

Ordered by visual impact, not by how many places the code needs to change.

1. **Fix the About panel's mobile header overlap (Critical #2).** Highest impact relative to effort — a small, contained fix (hide/fade the fixed header on mobile while `.about-open`, matching the existing `nav-hidden` pattern) that removes a genuinely illegible moment on a common device size.
2. **Give the case-nav tabs a guaranteed-visible backing (Critical #1 and High #3 together).** Both bugs share one root cause — transparent tabs with no independent contrast — and very likely share one fix (an opaque/semi-opaque backing behind the tab row). Fixing this once resolves the worst first impression on the site across both desktop and mobile.
3. **Soften the scroll-transition seam (High #4).** A single shadow/gradient addition on `.case-detail`'s top edge; brings the site's most custom-built interaction up to the same polish level as everything else.
4. **Resolve the 3-item impact-grid gap (High #5).** One CSS rule change (or a content-count-aware grid), applied once, fixes the ending of all three case studies at once.
5. **Ease the 1024px reading measure (Medium #6).** Lower urgency — nothing is broken, just denser than it needs to be at a common width.

---

## Implementation Verification

Implemented against the fixes approved for this pass (items 1–4 below); items 5 and 6 were investigated and documented, not auto-fixed, per instructions. Verified with Playwright at 1440/1280/1024/768/390/375px, driving the homepage, all 3 case studies, and the About panel — including actually scrolling through the hero-to-case-study transition rather than only inspecting static states.

| Issue | Status | What changed | Verified at |
|---|---|---|---|
| Hero case-switcher collision (1024–1280px) | **Not fixed — reverted at user's request** | Initially fixed by giving `.case-tab` an opaque scrim background (reusing `.hero-video__controls`'s `rgba(16,9,4,0.55)`), which resolved both this and the mobile contrast issue in one change. The user asked for the inactive tabs' look to be restored to no-background exactly as before; reverted `.case-tab` to `background: transparent`. Asked how to handle the resulting regression; the user chose to leave it fully transparent and accept the tradeoff rather than pursue an alternative (e.g., backdrop-filter blur, border glow) — see "Remaining visual issues" below. | 1024px, 1280px, 1440px (confirmed collision is back to original pre-fix state, matching the site's prior appearance) |
| Mobile case-switcher contrast | **Not fixed — same revert** | Tied to the same `.case-tab` background change above; reverted along with it, by the same user decision. | 390px, 375px |
| Mobile About panel header overlap | **Fixed** | Added a full-width fixed bar (`body.about-open .intro::before`, `background: var(--color-brand-red)`, matching `.about`'s own background) behind the fixed name/role header and "Close" control, so the panel's internally-scrolled bio text is properly occluded instead of showing through. Two bugs surfaced and were corrected during implementation: (1) attaching the bar to `.side-nav` instead of `.intro` painted it *over* `.intro`'s text, since `.side-nav` is later in the DOM — moved it to `.intro`, which is first; (2) a `position:fixed` pseudo-element paints in a later stacking phase than normal in-flow content regardless of DOM order, which hid `.intro__name` behind the bar even after moving it — fixed by adding `z-index:-1`, scoped to `.intro`'s own stacking context only (doesn't affect its position relative to `.about`). Desktop is unaffected — confirmed `.about` never scrolls internally at 1440/1280/1024, so the bar is a visual no-op there (same red already present). | 1440px, 1024px, 768px, 390px, 375px — scrolled to the panel's full extent at each; also re-checked with a longer settle delay after an initial test showed a transition-timing artifact (not a real bug) |
| Scroll-driven hero transition seam | **Fixed** | Added `box-shadow: 0 -32px 56px -12px rgba(16, 9, 4, 0.4)` to `.case-detail`, reusing the same `rgba(16,9,4,…)` dark-scrim color used throughout the site. As the panel rises to cover the pinned hero, this now reads as a soft lifted-edge shadow easing into the photo rather than a flat hard cut. Disabled (`box-shadow: none`) inside both the existing mobile (`max-width:980px`) and `prefers-reduced-motion: reduce` blocks, matching the pattern already used there for `margin-top`, since neither uses the sliding-cover mechanic. | 1440px, actually scrolled through the transition (not just static states) for both Case 1 (standard 200vh pin) and Case 3 (its own collapsed-height pinned run) — both now show the softened seam; mobile stacked layout confirmed shadow-free |

### Item 5 — Impact/Reflection 3-item grid: investigated, not changed

Looked at this again specifically asking "does it read as deliberate editorial composition, or unfinished?" rather than "is it numerically even." The site does genuinely embrace asymmetric grids elsewhere as a deliberate device — the zigzagging Key Design Decisions layout, the 1fr/1.4fr Exploration split — but in every one of those cases, *both* sides carry content at an uneven ratio. The 3-item Impact/Reflection grid is different in kind, not just degree: the empty area isn't a smaller column, it's a fully blank void roughly half the row's width, sitting beside a single short text block. That distinction — asymmetric-with-content vs. asymmetric-with-nothing — is what separates the site's real editorial pattern from this one. Combined with it occurring identically in all three case studies (i.e., nobody designed three different intentional endings that happen to converge on the same gap), this reads as a byproduct of one grid rule applied without checking the 3-item case, not a considered choice.

**Determination: genuinely looks unfinished, not intentional.** Per instructions, not changed automatically. Smallest viable adjustment, for consideration: let a lone third item span both columns (or center it) when a grid has exactly 3 children — a one-rule, content-count-aware tweak, not a redesign.

### Item 6 — 1024px line wrapping: investigated, not changed

Traced the cause precisely rather than guessing. At 1024px, `.case-detail__inner` (max-width 1300px) never actually reaches that cap — available width is `1024 − 48 (left gutter) − 104 (right gutter, which includes an extra +56px reserved for the desktop-only progress rail) ≈ 872px`. Split across the 3-column grid (two 62px gaps), each column lands at ≈249px. At 1440px, the same math gives ≈388px per column — hence the visibly denser wrapping at 1024px.

This is **not** the 1300px max-width (never engaged at this size) and **not** a font-size/typography issue — it's arithmetic on a fixed-pixel gutter/gap system that doesn't scale down between the 980px breakpoint and 1440px. The specific, identifiable contributor is the **asymmetric right gutter**: it's more than double the left gutter (104px vs. 48px) at every desktop width, and that extra +56px was added for a progress rail that most affects wider screens — at 1024px it's disproportionately expensive, costing the grid about 19px per column that a symmetric gutter wouldn't.

**Determination: a real, identifiable layout factor (not purely inherent to a narrower viewport), but not changed per instructions** — this is a gutter-system adjustment, not a typography change, and would need its own consideration (e.g., narrowing or dropping the rail-clearance allowance below some width) rather than a blind fix bundled into this pass.

### Remaining visual issues

- **Hero case-switcher collision at 1024–1280px** (Cases 1 and 2) and **mobile case-switcher contrast** (worst on Case 2) — both from the original Critical/High findings — are **still present**, by explicit user choice this session (see Implementation Verification table above). No CSS change stands in place of a fix; the `.case-tab` background is back to `transparent`, matching the site's prior appearance exactly.
- Item 5 (3-item grid) and Item 6 (1024px line measure) — determined to be real issues, deliberately left unimplemented per this task's instructions; see write-ups above.
- Everything else identified in the original QA (About link hover, quote/list token consistency, dead tokens, duplicate color token) was resolved in the prior design-system-fix pass and reconfirmed unaffected during this session's regression checks.

### Intentional exceptions (confirmed, left alone)

- The two-tier grid row-gap system, the large-heading letter-spacing values, the quote/bullet-list typographic differences between the dark hero panel and light case-detail body, and the `.case-tab` responsive size step (50px→44px) — all previously confirmed intentional in the design-system audit, unaffected by this pass.

### Deliberately not changed, and why

- **`.case-tab`'s background** — reverted per direct user instruction mid-implementation; the user was asked how to handle the resulting regression and chose to accept the tradeoff rather than pursue an alternative treatment.
- **Impact/Reflection grid item count** and **1024px gutter asymmetry** — both investigated and documented per explicit "do not automatically fix" instructions; left for a deliberate future decision rather than bundled into this pass.
- No typography, font sizes, or editorial content were touched anywhere in this pass.

# Handoff: Configurator Case Study Page

## Overview
A single scrolling case-study page for Anna Iarinovskaia's portfolio, documenting the "Energy Measures Configurator" project (problem → research → design evolution → key decisions → impact → reflection). It is the third page type in the portfolio, sitting visually between the existing dark landing page (video hero, numbered case-study index) and the deep-red About page. Each case study belongs to a category, shown in the hero meta row.

## About the Design Files
The file in this bundle (`Configurator Case Study.dc.html`) is a **design reference created in HTML** — a prototype showing intended look, structure and behavior. It is not production code to copy directly. It opens in any browser and uses inline styles only (no stylesheet, no build step), which is deliberate for prototyping and NOT the pattern to ship.

The task is to **recreate this design in the existing portfolio codebase**, using its established patterns (its component structure, routing, styling approach — CSS modules / Tailwind / styled-components, whatever is already there). If no codebase exists yet, pick the most appropriate framework (a static-site generator such as Astro or Next.js static export suits a portfolio) and implement it there.

## Fidelity
**High-fidelity.** Colors, typography, spacing rhythm and copy are final. Recreate the layout, type scale and color values as specified. The only exceptions are the image slots: every image is currently a striped grey placeholder with a caption describing what belongs there. Real screenshots/exports must be dropped in, keeping the stated aspect ratios.

## Screens / Views
One route, e.g. `/work/configurator`. Sections in DOM order:

### 0. Sticky header
- Sticky to top, z-index above content, background `rgba(242,239,233,0.92)` + `backdrop-filter: blur(8px)`, 1px bottom border `rgba(23,20,15,0.10)`.
- Padding `22px clamp(20px,4vw,56px)`. Flex, `space-between`, `align-items:flex-start`.
- Left: link "ABOUT" — DM Sans, 12px, uppercase, letter-spacing 0.14em, 1.5px solid `#17140F` bottom border, 4px padding-bottom. Navigates to the About page.
- Right, right-aligned, line-height 1.05: "Anna Iarinovskaia" in Marcellus `clamp(20px,2.4vw,30px)`; below it "Digital Product Designer", DM Sans `clamp(10px,1vw,13px)`, color `rgba(23,20,15,0.6)`, 3px top margin. Matches the landing and About pages exactly.

### 1. Hero (full-bleed red)
- Background `#7C1F1E`, text `#F2EFE9`. Padding `clamp(56px,9vw,140px) clamp(20px,4vw,56px) clamp(80px,10vw,160px)`. Inner max-width 1280px, centered.
- Meta row: flex-wrap, gap `14px 22px`, DM Sans 11px uppercase letter-spacing 0.16em, color `rgba(242,239,233,0.72)`. Items: pill "Case study 01" (1px solid `rgba(242,239,233,0.45)`, radius 999px, padding `6px 14px`, full-opacity text) — then "Product Design", a "/" at 0.5 opacity, "B2B SaaS · Energy". **The category is per-case-study data; drive it from the case's frontmatter/CMS entry.**
- H1 "Configurator": Marcellus, `clamp(52px,12vw,170px)`, line-height 0.9, letter-spacing -0.01em, `text-wrap:balance`, top margin `clamp(28px,4vw,56px)`.
- Sub-paragraph: `clamp(17px,1.9vw,26px)`, line-height 1.45, `max-width:34ch`, color `rgba(242,239,233,0.92)`, top margin `clamp(22px,3vw,40px)`. Copy: "A tool that helps asset managers explore renovation scenarios, improve energy efficiency, and optimize investment costs."

### 2. Hero image, overlapping
- Wrapper: horizontal padding `clamp(20px,4vw,56px)`, negative top margin `clamp(-60px,-7vw,-120px)`, `position:relative; z-index:5` so the image straddles the red/paper boundary.
- 16:9 placeholder, max-width 1280px. Caption chip bottom-left, on `#F2EFE9`: "product shot — configurator, 3D view with measures panel". Replace with the wide product screenshot; keep the overlap.

### 3. Section pattern (used by every numbered section)
- Header row: flex, `align-items:baseline`, gap 16px, bottom margin `clamp(20px,3vw,36px)` (or `clamp(28px,4vw,56px)` for the larger sections): number ("01") in accent, label in uppercase DM Sans 11px / letter-spacing 0.16em, then a flex-1 1px rule.
- Two-column body: `grid-template-columns: repeat(auto-fit, minmax(280px,1fr))`, gap `clamp(24px,4vw,64px)`, `align-items:start` — Marcellus headline left `clamp(32px,4.4vw,62px)` / line-height 1.03, body copy right at `max-width:60ch`, `clamp(15px,1.35vw,19px)` / line-height 1.65. Second paragraph in each pair is dimmed to `rgba(23,20,15,0.72)`.

**01 Overview** — "From hidden feature to flagship tool" + two paragraphs.

**02 Problem** — "Static reports, no flexibility" + two paragraphs. Below (top margin `clamp(36px,5vw,72px)`), a `minmax(260px,1fr)` two-up: left a 4:3 placeholder with caption "The static Energy Light Report - a predefined, non-interactive renovation report users previously relied on"; right a bordered list (1px `rgba(23,20,15,0.15)` top + per-row bottom, 18px vertical padding, `clamp(16px,1.6vw,22px)`) with accent-red 11px numbers 01/02/03: "Predefined scenarios", "No \"what if\" exploration", "No immediate feedback".

**03 Research** — lead paragraph at `clamp(19px,2.4vw,32px)` / line-height 1.4 / `max-width:44ch`. Then two columns (`minmax(300px,1fr)`):
- "What was working": two blockquotes. First is a filled red card (`#7C1F1E`, text `#F2EFE9`, padding `clamp(22px,3vw,36px)`); second is outlined (1px `rgba(23,20,15,0.18)`). Quote text Marcellus `clamp(22px,2.6vw,34px)` line-height 1.25; attribution DM Sans 11px letter-spacing 0.08em, 18px above.
- "What was still missing": bordered list, 20px vertical padding per row, `clamp(15px,1.35vw,19px)`; the last item ("The flow had to stay intuitive…") is accent red to mark it as the v3 constraint.
- Column headings are uppercase DM Sans 11px, letter-spacing 0.16em, weight 400, color `rgba(23,20,15,0.6)`, 24px bottom margin.

**04 Design Evolution (dark band)** — full-bleed `#17140F`, text `#F2EFE9`, padding `clamp(56px,8vw,120px) clamp(20px,4vw,56px)`, top margin `clamp(72px,10vw,150px)`. Section number/rule use `#D98B87` / `rgba(242,239,233,0.2)`. Three articles, gap `clamp(48px,7vw,110px)`, each a two-column `minmax(300px,1fr)` grid: left a version badge — "V0"/"V1"/"V2" in Marcellus `clamp(44px,6vw,86px)` line-height 0.9 next to a baseline-aligned uppercase 11px label ("First concept", "First shipped version", "Standalone configurator" — the last in `#D98B87`) — plus body copy `max-width:52ch` at `rgba(242,239,233,0.85)`; right a 16:10 dark placeholder (`#241F19` + `rgba(242,239,233,0.07)` stripes) with its caption at `rgba(242,239,233,0.5)`.

**05 Key Design Decisions** — back on paper. Four articles, gap `clamp(48px,7vw,110px)`, sub-headlines Marcellus `clamp(28px,3.6vw,50px)` line-height 1.05 `max-width:22–24ch`:
1. "Make ROI a first-class metric" — paragraph, then a before/after pair (`minmax(260px,1fr)`, 16:9). The "after" placeholder gets red-tinted stripes and `outline:1px solid #7C1F1E`. Each has an uppercase kicker ("Before - one figure among six" / "After - a headline stat next to cost", the latter in accent) plus a smaller descriptive caption.
2. "Keep the building at the centre" — 4:3 image left, text right, `align-items:center`.
3. "Keep the scenario visible" — text left, 4:3 image right (mirrored).
4. "Turn complex data into a decision" — flow chips row above the headline ("Explore → Configure → Analyse → Evaluate impact", accent, uppercase 11px, arrows at 0.5 opacity); paired with a 16:7 placeholder, grid `align-items:end`.

**06 Impact (red band)** — `#7C1F1E`, same padding/top-margin as the dark band. Three columns `minmax(260px,1fr)`, each with a 1px `rgba(242,239,233,0.3)` top rule and 24px padding-top: Marcellus stat `clamp(48px,6vw,88px)` line-height 0.95 ("80%", "10", "↗"), then a DM Sans 600 sub-head `clamp(16px,1.5vw,20px)`, then body `clamp(14px,1.25vw,17px)` at `rgba(242,239,233,0.85)`.

**07 Reflection** — pull-quote in Marcellus `clamp(26px,3.6vw,52px)` line-height 1.15 `max-width:32ch`, then two paragraphs in a `minmax(280px,1fr)` grid capped at 1000px, second dimmed.

### 8. Footer
- 1px top border, padding `clamp(40px,6vw,80px) clamp(20px,4vw,56px)`, flex-wrap, `space-between`, `align-items:flex-end`.
- Left: "EMAIL ↗" and "LINKEDIN ↗" (36px gap), same underlined uppercase treatment as the About page. Wire to `mailto:` and the LinkedIn URL.
- Right: next-case link — uppercase 11px "Next case study 02" at `rgba(23,20,15,0.55)` beside Marcellus `clamp(28px,4vw,56px)` "Coming next →", baseline-aligned, hover `#7C1F1E`. Replace with the real next case title/route once case 02 exists.

## Interactions & Behavior
- Header is sticky and translucent; content scrolls under it. Everything else is a plain document scroll.
- Links: default `color: inherit; text-decoration: none`, hover `#7C1F1E`. Underlines are 1.5px bottom borders, not `text-decoration`.
- `::selection` is `background:#7C1F1E; color:#F2EFE9`.
- No JS state, no animation in the prototype. If the portfolio already uses scroll-reveal or a page transition (the landing page implies one), apply the same treatment here rather than inventing a new one — keep it subtle: opacity/translateY, 300–500ms, ease-out.
- Responsive: every multi-column block is `repeat(auto-fit, minmax(260–300px, 1fr))`, so columns collapse to one on narrow viewports with no media queries. All type is fluid via `clamp()`. Nothing has a fixed pixel width; the only fixed geometry is image `aspect-ratio`. Preserve that — do not reintroduce fixed widths or breakpoints.

## State Management
None. Static content page. Content is per-case-study data (title, category, hero copy, sections, images, next-case link) — model it as frontmatter/CMS fields so further case studies reuse the same template.

## Design Tokens
Colors
- Paper / background: `#F2EFE9`
- Ink / text: `#17140F`
- Accent red (About-page red, bands + accents): `#7C1F1E`
- Ink band (Design Evolution): `#17140F`; placeholder fill on it `#241F19`
- Rose (accent on dark): `#D98B87`
- Placeholder fill on paper: `#E4DFD6`
- Rules: `rgba(23,20,15,0.15)` on paper, `rgba(242,239,233,0.25)` on red, `rgba(242,239,233,0.2)` on ink
- Dimmed body: `rgba(23,20,15,0.72)` on paper, `rgba(242,239,233,0.85)` on dark

Typography — Marcellus (display/serif) + DM Sans (everything else), both Google Fonts. Marcellus has no true italic; never synthesize one.
- Hero H1: Marcellus `clamp(52px,12vw,170px)` / 0.9 / -0.01em
- Section headline: Marcellus `clamp(32px,4.4vw,62px)` / 1.03
- Sub-headline: Marcellus `clamp(28px,3.6vw,50px)` / 1.05
- Stat / version badge: Marcellus `clamp(48px,6vw,88px)` / 0.95
- Lead: DM Sans `clamp(19px,2.4vw,32px)` / 1.4
- Body: DM Sans `clamp(15px,1.35vw,19px)` / 1.65
- Small body: DM Sans `clamp(14px,1.25vw,17px)` / 1.6
- Label / eyebrow: DM Sans 11px, uppercase, letter-spacing 0.16em (12px / 0.14em for nav + footer links)
- Caption: DM Sans 11px / 1.6

Spacing
- Page gutter: `clamp(20px,4vw,56px)`; content max-width 1280px
- Between sections: `clamp(72px,10vw,150px)`
- Band padding (top/bottom): `clamp(56px,8vw,120px)`
- Column gap: `clamp(24px,4vw,64px)`; article gap `clamp(48px,7vw,110px)`
- List row padding: 18–20px vertical

Radius / shadow — none anywhere, except the `999px` category pill. No shadows; the only elevation cue is the header blur. Keep it that way.

## Assets
No real assets are included. Ten image slots are striped placeholders (`repeating-linear-gradient(135deg, …0 1px, transparent 1px 9px)`), each captioned with what belongs there:
1. Hero, 16:9 — configurator 3D view with measures panel
2. Problem, 4:3 — static Energy Light Report
3. V0, 16:10 — early 3D-building concept
4. V1, 16:10 — configurator inside the property detail page
5. V2, 16:10 — standalone configurator with tabs + measures panel + cost table
6. Decision 1 before, 16:9 — ROI as one small figure in a dense row
7. Decision 1 after, 16:9 — ROI as a headline stat next to cost
8. Decision 2, 4:3 — measures selected on the 3D model with matching pills
9. Decision 3, 4:3 — ROI cost breakdown with persistent side panel
10. Decision 4, 16:7 — tabbed navigation

Export at 2× the rendered size, keep the aspect ratios, and use the existing captions as alt text.

## Files
- `Configurator Case Study.dc.html` — the full design reference. Open directly in a browser. All styling is inline in the markup; fonts load from Google Fonts in the head.

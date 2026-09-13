# Scope Guard — shared rules for all portfolio review agents

Every review agent in this project (`content-narrative-reviewer`, `visual-responsive-qa`, `design-system-auditor`, `accessibility-reviewer`) must follow these rules without exception. They exist because prior review passes on this portfolio (see `PROJECT_CONTEXT.md`, `DESIGN_SYSTEM_AUDIT.md`, `VISUAL_QA.md`) have gone stale, over-delivered relative to what actually got acted on, or nearly re-opened a decision the user had already made and explicitly rejected. These rules exist to prevent repeating those mistakes.

## 1. Read-only, always

You do not have `Edit` access to any file in this repository, and you must never use `Write` to create or overwrite a tracked project file — not HTML, not CSS, not JS, not images/video, not any existing markdown doc (including the design-system and visual-QA docs themselves). The only files you may create are the temporary artifacts your own agent instructions explicitly scope (e.g. a scratch screenshot or a throwaway Playwright driver script under a designated temp path) — never the portfolio's actual source, and never a "final" version of a report file. If you believe a change is warranted, describe it as a finding. Do not make it. The user reviews and approves all changes in the main conversation, not through you.

## 2. Verify before you cite

`PROJECT_CONTEXT.md`, `DESIGN_SYSTEM.md`, `DESIGN_SYSTEM_AUDIT.md`, and `VISUAL_QA.md` are known to contain stale claims — confirmed examples: `PROJECT_CONTEXT.md` currently misnames the site's display font (says Marcellus; it's actually Cormorant Garamond) and misdescribes Case 3 as containing placeholder Impact/Reflection copy and a missing screenshot, neither of which is true anymore. Treat every claim in these docs as a hypothesis to check against the live `index.html`/`css/`/`js/`, never as settled fact. When a doc and the live code disagree, the live code wins — and say so, don't quietly go with the doc.

## 3. Don't re-litigate accepted tradeoffs

Some issues found in prior review passes were deliberately left as-is by explicit user decision. The clearest example: the hero case-switcher tab collision with the laptop-screen mockup at 1024–1280px (and low contrast on mobile) was fixed once, then **reverted at the user's direct request** — see `VISUAL_QA.md`'s Implementation Verification log ("Not fixed — reverted at user's request"). If you encounter an issue that matches something documented as "deliberately not changed," "reverted per user request," or a "confirmed intentional exception" in an existing doc, do not present it as a new finding. You may note it once, outside your ranked findings list, as a one-line FYI — never as something requiring action, and never re-fixed on your own initiative (you have no write access to do so anyway, but the same restraint applies to how you *talk about* it).

## 4. Never invent

You must never fabricate or imply the existence of: metrics, user quotes, research findings, business outcomes, or portfolio/work experience that isn't already present in the codebase. If a claim in the copy lacks supporting evidence, say so as a gap — do not suggest a plausible-sounding number, quote, or outcome to fill it, not even as an illustrative example.

## 5. No redesign by preference

A finding must trace to something concrete: a stated design-system rule (e.g. the site's explicit zero-border-radius rule), an accessibility standard, a broken interaction, or a contradiction between the code and the site's own documented intent. "I would have done this differently" is never sufficient on its own — see `finding-format.md`'s Objective/Subjective rules, and never let a pure preference occupy a Critical or High severity slot.

## 6. Small, prioritized output

Maximum 5 Critical/High findings per run, ordered by hiring/recruiter impact — not by ease of fix or how interesting the finding is. See `finding-format.md` for the exact structure, severity, and classification rules. Do not produce exhaustive catalogs; that failure mode is exactly what made the prior `DESIGN_SYSTEM_AUDIT.md` and `VISUAL_QA.md` valuable-but-bloated, and this system exists to do better.

## 7. Stay in your lane

Each of the four agents owns a distinct domain — content/narrative, visual/responsive rendering, design-system tokens, accessibility. Do not produce findings that belong to another agent's domain; each agent's own file has an "Avoiding overlap" section defining the exact boundary. If something you notice clearly belongs to another domain, mention it in one line as a pointer ("worth a Visual QA pass on X") — not as a full finding of your own.

## 8. Before you start

Read `.claude/agents/_shared/finding-format.md` now, in full, if you haven't already — it defines the exact structure every finding must use, including severity and classification rules.

---
description: Run the Accessibility Reviewer against the portfolio. First run establishes a baseline (findings only — no file is created automatically).
argument-hint: "(no arguments)"
---

Launch the `accessibility-reviewer` subagent (Agent tool, `subagent_type: accessibility-reviewer`) to review the portfolio's accessibility.

When it returns, present its findings to the user exactly as returned. **Do not create or modify `ACCESSIBILITY_AUDIT.md` or any other file.** Whether to persist these findings as a new baseline document is the user's explicit, separate decision — ask, don't assume, if they seem to want that after seeing the report.

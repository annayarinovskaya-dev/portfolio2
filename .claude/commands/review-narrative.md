---
description: Run the Content/Narrative Reviewer against the portfolio's case-study and About-page copy.
argument-hint: "[case=1|2|3] — omit to review the whole site"
---

Launch the `content-narrative-reviewer` subagent (Agent tool, `subagent_type: content-narrative-reviewer`) to review the portfolio's narrative content. Tell it explicitly in your prompt: scope is "$ARGUMENTS" (if blank, review all three case studies plus the hero/About positioning as a whole).

When it returns, present its findings to the user exactly as returned — do not compress, re-summarize away detail, or add findings of your own. Do not make any edits based on its output. If the user asks you to act on a specific finding afterward, treat that as a new, separate request: confirm the exact change with them before touching `index.html`.

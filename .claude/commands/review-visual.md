---
description: Run the Visual/Responsive QA agent against the live, rendered portfolio site.
argument-hint: "[case=1|2|3 | state=about] — omit for a full sweep"
---

Launch the `visual-responsive-qa` subagent (Agent tool, `subagent_type: visual-responsive-qa`) to QA the rendered site. Tell it explicitly in your prompt: scope is "$ARGUMENTS" (if blank, run its full sweep — hero for all three cases, the About panel, hover states, and the scroll transition, at the viewports `VISUAL_QA.md` already established: 1440/1280/1024/768/390/375).

Remind it in your prompt: reuse `pixel-match/shot_default.py`/`shot_case3.py` where they already cover a state; any new capture script it needs is temporary, lives only under `pixel-match/tmp-visual-qa/`, and must not be presented as permanent tooling.

When it returns, present its findings to the user exactly as returned, including the screenshot paths it cites as evidence. Do not make any edits based on its output.

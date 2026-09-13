---
description: Run the Design System Auditor to find NEW drift since the last recorded DESIGN_SYSTEM_AUDIT.md pass.
argument-hint: "(no arguments)"
---

Launch the `design-system-auditor` subagent (Agent tool, `subagent_type: design-system-auditor`) to check for design-system drift since the last audit.

When it returns, present the drift report to the user exactly as returned. **Do not append it to `DESIGN_SYSTEM_AUDIT.md` or any other file.** Persisting the report (or any subset of it) into `DESIGN_SYSTEM_AUDIT.md` only happens if the user explicitly asks for that as a separate, follow-up step — treat that as a distinct request with its own confirmation, not something implied by running this command.

# Finding Format — shared output template

Every finding reported by any of the four portfolio review agents must use this exact structure. Do not omit a field. Do not add narrative outside a finding's fields except the specific unranked framing elements each agent's own instructions allow (e.g. the Content/Narrative Reviewer's "Positioning snapshot").

## Per-finding template

```
### [N]. <short title>

- Domain: Narrative | Visual/Responsive | Design System | Accessibility
- Severity: Critical | High | Medium | Low
- Classification: Objective | Subjective
- Evidence: <file:line, screenshot path, viewport+state, or exact rendered text/element cited verbatim>

Problem: <what is actually wrong or missing, stated as observed fact — even for a Subjective finding, state what was observed before offering judgment>

Why it matters: <the concrete consequence for a hiring manager, recruiter, or real visitor — not "it would be nicer," but what someone actually experiences or concludes>

Recommended action: <a specific, scoped action. If you're not certain what the right fix is, say what information is needed to decide — never guess at content, metrics, or a specific implementation you haven't verified would work>
```

Some agents add one or two extra fields on top of this template (see their own instructions) — always in addition to, never instead of, the fields above.

## Classification rules

- **Objective** — verifiable against a rule, a standard, or the site's own stated intent: a WCAG success criterion, a broken/overlapping layout, a duplicated design token, a claim in the copy contradicted by the code, a section present in one case study and structurally absent in another.
- **Subjective** — a craft/taste judgment. Must still be traceable to something concrete (a stated design-system rule, an accessibility standard, or an explicit project goal like "communicate seniority") — "I would have designed this differently" alone is not admissible. A Subjective finding must explain *why a reasonable reviewer, not just this agent,* would flag it.
- **A Subjective finding is capped at Medium severity.** Never Critical or High.

## Ordering and count

- Findings are ordered Critical → High → Medium → Low, and within a tier, by hiring/recruiter impact — not by ease of fix, not by how interesting the finding is.
- **Maximum 5 Critical/High findings per run.** If more exist, list their titles only (no full write-up) under a single collapsed line: "N additional Medium/Low findings exist — ask to see the full list."
- A run that turns up zero Critical/High findings should say so plainly — "No Critical/High findings this run" — rather than manufacturing findings to fill a quota, and rather than silently omitting the section.

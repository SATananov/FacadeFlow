# ASSEMBLY FUNCTIONALITY 01F — GLAZING EVIDENCE GAP REGISTRY

## Goal
Turn the 01E evidence status into an actionable, deduplicated queue of missing knowledge.

01F does **not** invent or approve any new glazing rule. It groups repeated blockers so one missing rule is represented once even when it affects many joint occurrences.

## Gap kinds
- FIELD INPUT — missing/invalid human-controlled glazing context for one FIELD.
- CATALOGUE BEAD/THICKNESS — missing source-bound nominal bead/thickness evidence.
- BEAD ↔ BASE REVIEW — catalogue thickness match exists, but no reviewed rule proves the selected bead against the base profile.
- PLACEMENT EVIDENCE — glazing inset / seat / bead placement is not proven.
- GLASS CUT RULE — no reviewed rule converts FIELD geometry into a glass cutting dimension.

## Deduplication
Gaps are grouped by the concrete rule identity that is missing. For example, eight joints using the same 482.15 bead against 482.05 sash produce one compatibility gap with eight affected joint occurrences, not eight independent rules.

## Safety boundaries
- INPUT CONTEXT != EVIDENCE.
- CATALOGUE EVIDENCE != BEAD-TO-BASE COMPATIBILITY.
- COMPATIBILITY != PLACEMENT.
- REFERENCE CORRECTION != REVIEWED GLASS CUT RULE.
- AUTOMATIC GEOMETRY = NO.
- RULES VALIDATED = NO.
- MACHINE READY = NO.

# Global Rules

These rules apply to every agent, every role, and every task in FacadeFlow.

## Safety Boundaries

AUTOMATIC GEOMETRY = NO
RULES VALIDATED = NO
MACHINE READY = NO
UNKNOWN FACTS MUST REMAIN UNKNOWN

These boundaries must never be upgraded, softened, or reworded as `PASS` unless explicit project evidence and the relevant verifier prove otherwise.

## Evidence Classification

Every factual claim used for implementation or review must be classified as one of:

- VERIFIED: supported by inspected repository code, executed verifier, authoritative source, or explicit human instruction.
- LIKELY: supported by naming, structure, or repeated local pattern, but not proven.
- ASSUMED: a working assumption chosen to proceed.
- UNKNOWN: not established.

ASSUMED and UNKNOWN values must not enter production geometry as facts.

## Technical Fact Rules

- Never invent catalogue dimensions.
- Never infer handing when it is not explicitly known.
- Never convert visual requirements into domain facts.
- Never change geometry only to improve visual appearance.
- Never silently change persistence semantics.
- Never silently change Undo/Redo behavior.
- Existing verified behavior must be preserved unless the task explicitly replaces it.
- Unknown measurements, overlaps, insets, profile relationships, and technical rules remain UNKNOWN.
- Unsupported configurations fail closed.
- Preserve module, field, divider, profile, evidence, and revision identities unless an explicit migration requires otherwise.
- Preserve ZERO_DIVIDER semantics.
- Do not infer opening handing, hinge geometry, or threshold geometry when not explicitly known.
- Use "sketch" / "скица" for technical visual representations where appropriate.
- Do not introduce the name SkyGlazing anywhere in application-facing source or product behavior.

## Repository Safety

- Inspect every relevant file before editing it.
- Do not modify geometry, catalogue, validation, project model, serialization, persistence, or domain logic unless the task explicitly requires it.
- Do not modify source behavior for documentation-only tasks.
- Do not alter verified behavior merely to make a verifier pass.
- Do not edit generated build output as source code.
- Never delete files unless explicitly requested.
- Never overwrite or remove backups or ZIP checkpoints.
- No agent commits or pushes without explicit human instruction.

## Verification Rules

- Never claim PASS without actually running the relevant validation.
- After source-code changes, run `npm run lint` and `npm run build`.
- Run all relevant feature-specific verifiers for the changed area.
- Treat warnings separately from failures.
- If a verifier conflicts with newer intentional project work, identify the reason before changing production code or verifier expectations.
- Verifier Agent must remain independent from implementation.


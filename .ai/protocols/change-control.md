# Change Control Protocol

## Ownership

- Each task has one primary implementation owner.
- Supporting agents should prefer review/advice over concurrent edits.
- Cross-domain files require Orchestrator sequencing.
- Geometry/domain changes require Geometry Agent participation.
- Catalogue facts require Profile/Catalog Agent or Evidence Agent review.
- Completed implementation always goes to Verifier Agent.

## Human Boundaries

- Human visual acceptance remains required for visual drawing changes.
- Human review is required before treating ASSUMED or UNKNOWN facts as production facts.
- Commit is separate from implementation acceptance.
- No commit, push, branch switch, reset, restore, clean, rebase, amend, or force-push without explicit human instruction.

## Protected Behavior

- Do not modify geometry/domain behavior unless explicitly requested.
- Do not silently change persistence semantics.
- Do not silently change Undo/Redo behavior.
- Do not alter verified behavior merely to make a verifier pass.
- Do not edit generated build output as source code.

## Verification Gate

For source-code changes:

1. Run relevant feature-specific verifiers.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Run `git diff --check`.
5. Inspect `git status --short`.
6. Report PASS/FAIL, warnings, regressions, assumptions, and remaining risks.

## Sequential Role Mode

If true autonomous subagents are not VERIFIED SUPPORTED, one runtime agent may execute the workflow sequentially only by making role boundaries explicit:

1. Orchestrator routing plan.
2. Specialist implementation and `READY FOR VERIFICATION` handoff.
3. Verifier independent diff/rules review with no repairs.
4. Orchestrator final consolidation.

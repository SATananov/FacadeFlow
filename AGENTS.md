# FacadeFlow AI Agent Rules

## Safety boundaries

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

These boundaries must never be upgraded or reworded as PASS unless explicit project evidence and the relevant verifier prove otherwise.

## File safety

1. Never delete files unless explicitly requested.
2. Never modify files outside the FacadeFlow repository.
3. Inspect every relevant file before editing it.
4. Do not modify geometry, catalogue, validation, project model, serialization, or domain logic unless the task explicitly requires it.
5. Do not alter verified behavior merely to make a verifier pass.
6. Never overwrite or remove backups or ZIP checkpoints.
7. Do not edit generated build output as source code.

## Git safety

1. Never commit unless explicitly requested.
2. Never push unless explicitly requested.
3. Never switch branches unless explicitly requested.
4. Never reset, restore, clean, rebase, amend, or force-push unless explicitly requested.
5. Show git diff and git status after code changes.
6. Keep unrelated existing changes untouched.

## Validation

1. Never claim PASS without actually running the relevant validation.
2. After source-code changes, run:
   - npm run lint
   - npm run build
3. Run all relevant feature-specific verifiers for the changed area.
4. Treat warnings separately from failures.
5. Do not change verifier expectations blindly just to obtain PASS.
6. If a verifier conflicts with newer intentional project work, identify the reason before changing either production code or the verifier.
7. Distinguish VERIFIED results from assumptions.

## FacadeFlow project rules

1. Never invent catalogue dimensions, overlaps, insets, profile relationships, or technical rules.
2. Unknown technical facts must remain explicitly unknown.
3. Unsupported configurations must fail closed.
4. Preserve Undo/Redo behavior.
5. Preserve module and field identities unless an explicit migration requires otherwise.
6. Preserve ZERO_DIVIDER semantics.
7. Do not infer opening handing or hinge geometry when it is not explicitly known.
8. Use the term "sketch" / Bulgarian "скица" for technical visual representations where appropriate.
9. Do not introduce the name SkyGlazing anywhere in the project.
10. Existing verified safety and readiness boundaries take precedence over convenience.

## Working method

For each modification:

1. Inspect.
2. Explain the intended change.
3. Make the smallest necessary change.
4. Verify.
5. Report:
   - files changed
   - validations run
   - PASS/FAIL results
   - regressions
   - assumptions
   - remaining risks

If the requested change is ambiguous or could affect protected domain behavior, ask before modifying it.

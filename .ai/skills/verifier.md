# Verifier Agent

The Verifier Agent must be independent from implementation.

## Responsibilities

- Inspect the diff.
- Identify affected verification scope.
- Run relevant feature-specific verifiers.
- Run `npm run lint`.
- Run `npm run build`.
- Check regression risk.
- Check global safety boundaries.
- Report warnings separately from failures.

## Must Not

- Repair implementation while verifying it.
- Change verifier expectations blindly to obtain PASS.
- Claim PASS without actually running the relevant command.
- Commit or push.

If repair is required, return the task to the Orchestrator.

## Verification Scope Guide

- Geometry/topology: constructor topology, divider, profile-aware geometry, joint geometry, and sash geometry verifiers.
- Drawing/sketch: constructor technical drawing, door view/orientation, opening-symbol, dimension, and visual drawing verifiers.
- Profile/catalog/evidence: profile resolution, glazing evidence/context, PRELUDE door evidence, system standard/rules verifiers.
- UI/UX: constructor UX/guidance/view, project UI, and user-facing language verifiers.
- Persistence/history: project foundation/runtime, active offer persistence, human undo session, release/integrated acceptance where relevant.
- Assembly: assembly foundation/functionality/model/geometry verifiers.

Always include `git diff --check` and `git status --short` in final verification for changed files.


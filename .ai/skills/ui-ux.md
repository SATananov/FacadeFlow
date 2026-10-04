# UI/UX Agent

## Owns

- Interaction.
- Navigation.
- Panels.
- Guidance/help.
- Labels.
- Responsive UX.
- Workflow clarity.

Primary repository areas:

- `src/App.tsx`
- `src/App.css`
- `src/components/*Panel.tsx`
- `src/components/*Panel.css`
- `src/components/ConstructorShell.tsx`
- `src/components/ConstructorShell.css`
- `src/components/GlobalGuidance.tsx`
- `src/components/GlobalGuidance.css`
- UI/UX verifiers such as `scripts/verify-constructor-ux*`, `scripts/verify-constructor-guidance*`, `scripts/verify-project-foundation02-ui-*`, and `scripts/verify-user-facing-language01.mjs`.

## Must Not

- Alter domain semantics to simplify UI.
- Silently change persistence behavior.
- Silently change Undo/Redo behavior.
- Hide UNKNOWN status by converting it to a UI default that looks verified.
- Change sketch or geometry semantics without Drawing or Geometry review.

## Required Checks

- Preserve workflow meaning and identity.
- Keep labels truthful about evidence status.
- Use Bulgarian/user-facing language consistently where existing UI does.
- Route source changes touching `ConstructorShell.tsx` through Orchestrator because it is cross-domain.


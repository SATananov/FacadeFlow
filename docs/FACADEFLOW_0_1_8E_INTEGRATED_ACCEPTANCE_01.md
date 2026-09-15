# FacadeFlow 0.1.8E — Integrated Acceptance 01

Purpose: verify the repaired 0.1.8 foundation as one coherent technical workflow without adding product behavior.

Automated runtime acceptance covers:

1. Two Offer modules with independent canonical topology and profile/glazing configuration.
2. Module switching changes selection only; technical state remains isolated.
3. A combined Constructor + glazing edit changes only Module 1.
4. An incompatible existing bead is invalidated; no replacement bead is auto-selected.
5. Atomic history restore path returns the exact pre-edit construction + profile resolution + module type.
6. Redo restore path returns the exact edited state.
7. Reset clears only the active module; restoring the pre-reset technical snapshot returns the whole module and does not alter Module 2.
8. Save -> reopen preserves both modules, active module identity, FIELD semantics, profile assignments and glazing ownership.

The runtime fixture intentionally exercises the actual Project/Offer/Module graph, project operations, profile/glazing domain logic, LocalProjectStorage, and the actual `useProjectWorkspace` callback adapters through a small React-hook host.

The existing 0.1.8B verifier remains authoritative for the ConstructorShell history wiring and per-module in-session history cache. The existing 0.1.8C and 0.1.8D verifiers remain authoritative for Form -> Constructor handoff and FIELD glazing ownership respectively.

## Acceptance boundary

This stage does not persist Undo/Redo history across app restart. It verifies final technical state persistence only.

Zoom, pan, selected FIELD, inspector tab and other view-only state are not required to survive restart in 0.1.8E.

No automatic divider geometry is introduced. No glazing bead is auto-selected. Unknown/unreviewed production facts remain unknown/unreviewed.

AUTOMATIC BEAD SELECTION: NO
AUTOMATIC GEOMETRY: NO
RULES VALIDATED: NO
MACHINE READY: NO

## Human installed-app smoke before release checkpoint

After automated PASS, perform one manual smoke in the Windows app:

- Open one Offer with two modules.
- Give the modules visibly different FIELD layouts/configurations.
- In Module 1 change one FIELD/opening and one glazing value, then Undo and Redo.
- Reset Module 1, then Undo; Module 2 must remain unchanged.
- Save, close/reopen the project, and compare both modules.
- Confirm no bead was silently auto-selected and no geometry was invented.

A failure in this human smoke blocks the 0.1.8 release checkpoint even if the automated verifier passes.

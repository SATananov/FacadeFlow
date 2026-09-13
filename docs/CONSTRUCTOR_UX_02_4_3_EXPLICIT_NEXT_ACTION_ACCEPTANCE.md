# CONSTRUCTOR UX 02.4.3 — Explicit Next Action

## Goal

Remove the remaining ambiguous **Продължи** state from the guided inspector. A completed FIELD must point to the exact next human action, and an OPERABLE FIELD must never look complete while the common frame profile is still missing.

## Accepted behavior

- Guided dependency order is explicit: frame profile → module type (when needed) → sash profile → glazing thickness → glazing bead.
- FIELD completion copy says only that the data for that FIELD are entered; it does not claim technical readiness.
- Missing frame profile cannot be masked by already-entered sash/glazing/bead inputs.
- After a FIELD is locally complete, the primary action names the exact next destination:
  - `Към профила на делителя`, when applicable;
  - exact action for the next FIELD; or
  - `Към прегледа на сглобката` when no guided input remains.
- Generic `Продължи` is removed from the FIELD completion action.
- No automatic profile, glazing or bead selection is introduced.

## Boundaries

- CONSTRUCTION TOPOLOGY: UNCHANGED
- PF01 / PF02: UNCHANGED
- AF01A: UNCHANGED
- AUTOMATIC PROFILE SELECTION: NO
- AUTOMATIC GLAZING SELECTION: NO
- AUTOMATIC BEAD SELECTION: NO
- MACHINE READY: NO
- NO COMMIT / NO PUSH

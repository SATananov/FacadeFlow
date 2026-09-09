# CONSTRUCTOR 01C.3.4 — Free Sketch Module Workspace Acceptance

## Goal

Make the free Constructor module-aware before angled/polygon geometry is added. A sketch is no longer edited in an unnamed `Module —` context.

## Accepted behavior

- In free Constructor mode, drawing is blocked until the user chooses **Create Module 1** (`Създай Модул 1`).
- The first module is numbered `1`; **New module** (`+ Нов модул`) creates the next sequential number.
- Every free module has its **own independent Constructor draft**.
- The user can switch back to Module 1, Module 2, Module 3, etc. and recover that module's exact draft.
- The top context, stage badge, and module tabs always make the active module visible.
- Reset clears **only the active module** and leaves the other modules untouched. Undo remains local to the currently mounted module session.
- The offer-mode module lifecycle introduced in 01C.3.3 remains unchanged.
- Creating an offer from a free sketch continues to use the active free module as the source sketch in this stage; whole-workspace conversion is intentionally deferred.

## Safety boundary

- ANGLED DIVIDER: NEXT STAGE
- PROFILE RESOLUTION: NO
- AUTOMATIC PRODUCTION GEOMETRY: NO
- MACHINE READY: NO

This stage is navigation/state architecture only. It does not infer profiles, sash geometry, glazing deductions, BOM, cuts, or machine operations.

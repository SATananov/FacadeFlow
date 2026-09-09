# Constructor 01C.3.3 — Independent Divider Positioning + Module Lifecycle

## Goal

Make repeated dividers behave independently and turn the Constructor from a single-Module-1 workspace into a sequential multi-module workflow without changing the modern FacadeFlow visual language.

## Divider acceptance

- Moving one vertical divider must not translate another vertical divider that already exists deeper in the same FIELD topology.
- Moving one horizontal divider follows the same rule.
- Descendant dividers on the same axis preserve their absolute canvas position while the selected divider moves.
- The selected divider is clamped before a preserved divider would be forced through the minimum FIELD boundary.
- Local cross-axis dividers still belong to their parent FIELD and their span follows that FIELD.
- Divider face remains the 40 mm schematic read-only placeholder from 01C.3.2.
- Undo / Redo remains one history step per divider drag.

## Module lifecycle acceptance

- An offer starts with `Модул 1`.
- `+ Нов модул` creates the next sequential module number (`Модул 2`, `Модул 3`, ...).
- Every module has its own Constructor draft.
- The active module is clearly visible in the Constructor header and module strip.
- Clicking a module tab switches back to that module for editing.
- Switching modules must not overwrite another module's Constructor draft.
- The offer module workspace also exposes the same module tabs.
- Module technical defaults are inherited from the offer snapshot when a new module is created.

## Start-over acceptance

- `Изтрий скицата` clears only the active module construction.
- It does not delete the offer or other modules.
- Undo can restore the cleared construction in the current Constructor session.
- Constructor-derived FIELD count and dimensions are cleared/synchronized with the reset.

## Angled divider boundary

The toolbar reserves `Ъглов делител` for the next geometry stage. It is intentionally not implemented as a decorative CAD line. A real angled divider must split a FIELD into polygon/trapezoid regions and expose independently movable top/bottom endpoints before it can become canonical.

## Safety boundary

- `ANGLED FIELD TOPOLOGY: NEXT STAGE`
- `PROFILE RESOLUTION: NO`
- `AUTOMATIC PRODUCTION GEOMETRY: NO`
- `MACHINE READY: NO`

# Constructor 01C.3 — Frame Interior (divider resize semantics superseded)

## Historical status

Constructor 01C.3 introduced the canonical frame interior and experimentally allowed direct divider-face resizing.
That direct thickness-editing behavior is **superseded by Constructor 01C.3.2** after domain review.

## Still accepted from 01C.3

- The outer frame keeps the module overall width and height.
- Before Profile Resolution, the frame uses a neutral schematic face of **60 mm**.
- The canonical FIELD root begins at the **inner edge of the frame**.
- FIELD selection highlights only the interior FIELD surface.
- A divider still splits exactly one parent FIELD.
- Divider body drag changes position.
- Undo / Redo remains available for construction edits.
- The outer module size never changes merely because a divider is moved.

## Superseded behavior

- Direct pointer resize of divider face width: **REMOVED by 01C.3.2**.
- Numeric divider thickness editing: **REMOVED by 01C.3.2**.
- The old 20–200 mm direct thickness range is no longer a user control.

## Safety boundary

- `PROFILE RESOLUTION: NO`
- `AUTOMATIC PRODUCTION GEOMETRY: NO`
- `MACHINE READY: NO`

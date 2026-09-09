# Constructor 01D.1 — Working Opening Symbols Acceptance

## Goal

Replace the universal neutral X with readable working opening symbols that match the shop convention visible in Nadezhda / SkyGlazing references, while keeping FIELD semantics and geometry deterministic.

## Canonical visual mapping

For an `OPERABLE` FIELD:

- no opening mode yet -> sash contour only;
- `side-hinged + left` -> hinge side LEFT / handle side RIGHT: two lines from the left corners to a midpoint at the right side (`>` working mark);
- `side-hinged + right` -> mirror image: two lines from the right corners to a midpoint at the left side (`<` working mark);
- `tilt` -> two lines from both lower corners to the top midpoint (`^` working mark);
- `tilt-turn + left` -> LEFT side-hinged mark plus tilt mark;
- `tilt-turn + right` -> RIGHT side-hinged mark plus tilt mark;
- a small handle marker is shown on the working/handle side for side-hinged and tilt-turn modes.

`FIX` has no opening symbol.

## UI behavior

- `КРИЛО`, opening mode and LEFT/RIGHT are separate compact chips; mode text is no longer combined into one truncated line.
- LEFT/RIGHT symbols are visually mirrored.
- Changing LEFT <-> RIGHT changes only the working symbol and canonical handing value; frame/FIELD/divider geometry is unchanged.
- Changing to `tilt` removes LEFT/RIGHT handing and shows only the tilt mark.
- Changing to `FIX` removes the sash opening symbol.
- Undo/Redo continues to restore semantic changes.

## Polygon behavior

The symbol lives inside the canonical FIELD surface. Rectangle, triangle, trapezoid and general polygon FIELD clipping remain authoritative, so symbol lines cannot escape the actual FIELD boundary.

## Safety boundary

- SYMBOLS: WORKING CONSTRUCTOR CONVENTION
- PROFILE RESOLUTION: NO
- HARDWARE RESOLUTION: NO
- AUTOMATIC PRODUCTION HINGE GEOMETRY: NO
- MACHINE READY: NO

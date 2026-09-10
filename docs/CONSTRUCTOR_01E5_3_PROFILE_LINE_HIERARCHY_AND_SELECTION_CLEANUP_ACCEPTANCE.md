# CONSTRUCTOR 01E.5.3 — PROFILE LINE HIERARCHY & SELECTION CLEANUP

## Purpose
Move the FacadeFlow constructor drawing closer to the supplied SkyGlazing visual reading by reducing redundant parallel lines and keeping only the lines that explain the construction.

## Visual contract
- The drawing must read in the hierarchy FRAME -> DIVIDER -> SASH -> GLAZING.
- The outer frame keeps a clean technical contour without an extra offset helper contour.
- Generic FIELD inset contours are removed; the operable sash ring becomes the main internal profile signal.
- OPERABLE fields still show a schematic sash outer contour and inner glazing contour.
- Divider faces remain clear but use fewer decorative highlight lines.
- Selecting a field must not add extra nested technical contours.
- The number-in-circle badge remains the main in-canvas field label.

## Technical boundary
This remains visual polish only.
It does not infer catalog overlap, rebate, sash face, cut geometry, or machine geometry.

Geometry / topology / FIELD semantics: unchanged.
Profile Resolution 02A / 02A.2 / 02A.3: unchanged.
BOM / cut list / machine: NO.
MACHINE READY: NO.

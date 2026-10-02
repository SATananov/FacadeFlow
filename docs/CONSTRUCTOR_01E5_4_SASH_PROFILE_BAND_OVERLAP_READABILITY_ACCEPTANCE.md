# CONSTRUCTOR 01E.5.4 — SASH PROFILE BAND & OVERLAP READABILITY

## Goal
Make the technical sketch read with the same clear construction hierarchy visible in the supplied reference: FRAME → DIVIDER → SASH PROFILE BAND → GLAZING.

## Reviewed visual contract
- The outer FRAME remains the strongest perimeter; divider styling remains unchanged.
- An OPERABLE FIELD shows a separate light SASH profile band. Its outside contour is stronger than its glazing-side contour, and both contrast clearly with the infill.
- The glazing remains visually inside the sash, beginning after its inner contour.
- A FIXED FIELD remains glazing-only and does not acquire a sash band.
- The fixed/operable distinction comes from the existing operable-only sash band, not a permanent text badge.
- Selection remains a separate existing state cue and is not used to communicate field type.
- Opening marks remain schematic. Directional side-hinged, tilt-turn, and side-hinged-top-hung marks, and the corresponding handle cue, remain conditional on explicit known left/right handing; tilt-only and top-hung marks do not imply handing. Unknown handing stays visually unknown.
- Increased contour contrast must remain readable at small zoom; this requires human visual review.
- No additional parallel contours or changes to CSS inset positions are introduced.
- The existing sash outer contour position remains unchanged, preserving the reviewed frame/divider/sash relationship.
- Sash mitre seams remain only inside the sash profile band.
- Opening symbols remain anchored to the glazing-side sash contour.
- FIX fields remain glazing-only and do not receive a sash profile band.

## Technical boundary
This package changes only final CSS line contrast. It does not alter geometry, SVG coordinates, field sizes, dividers, module or field semantics, opening behavior, Undo/Redo, ZERO_DIVIDER, or readiness logic. No physical overlap, rebate, sash-face, glazing inset, cut angle, or catalogue dimension is inferred or stored. No handing or hinge geometry is inferred or stored.

GEOMETRY / TOPOLOGY / FIELD SEMANTICS: UNCHANGED
PROFILE RESOLUTION 02A / 02A.2 / 02A.3: UNCHANGED
BOM / CUT LIST / MACHINE: NO
MACHINE READY: NO

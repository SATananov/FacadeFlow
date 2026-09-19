# FIX46 — Profile identity callout clearance 01

## Goal

Keep the FIX45/FIX45.2 semantic profile identity visible in the final assembly without making the operator read a leader that begins in the middle of a profile bounding box or competes with the catalogue dimension lanes.

## Accepted scope

- The support-profile identity leader anchors on the support profile box edge instead of its center.
- The sash-profile identity leader anchors on the sash profile box edge instead of its center.
- The support label prefers the free lane above its profile because its catalogue dimensions already occupy bottom + left.
- The sash label prefers the free lane below its profile because its catalogue dimensions already occupy top + right.
- If the preferred lane would leave the SVG view, the callout falls back to a bounded side lane.
- The semantic mapping locked by FIX45.2 remains unchanged:
  - `482.21` -> divider / mullion -> support box -> 60 x 84 mm;
  - `482.05` -> sash -> sash box -> 60 x 56 mm.

## What does not change

- catalogue profile dimensions;
- canonical support or sash coordinates;
- profile raster placement, scale or rotation;
- system correction value;
- overlap status;
- exact mate X/Y/rotation;
- BOM, production or machine readiness.

## Safety boundary

`UNKNOWN OVERLAP = EXPLICIT / NOT INVENTED`

`AUTOMATIC GEOMETRY = NO`

`RULES VALIDATED = NO`

`PRODUCTION AUTO-UNLOCK = NO`

`MACHINE READY = NO`

# FIX47 — Technical reading clearance 01

## Goal

Clean the final-assembly technical reading after FIX46 without changing the assembly itself. The operator must be able to distinguish profile identity, catalogue envelope dimensions and the 8.5 mm system reference without reading through the darkest part of the section.

## Accepted scope

- Known PRELUDE 60 profile identity leaders end on reviewed visible contour points in the raster artwork instead of the geometric bounding-box edge.
- The contour points are annotation metadata only. They do not define or change profile placement, mate geometry, overlap or production coordinates.
- When the two profiles are side-by-side, their vertical catalogue dimensions are placed on the outer sides of the assembly instead of the shared joint corridor.
- When the profiles are stacked, the equivalent horizontal catalogue dimensions use the outer top/bottom lanes.
- The 8.5 mm system correction keeps the same value and endpoints, but receives a routed leader and an isolated white label box for clean reading.
- Profile bounding rectangles remain available as helpers but are visually quieter.
- FIX45.2 semantic mapping remains unchanged:
  - `482.21` -> divider / mullion -> support profile -> 60 x 84 mm;
  - `482.05` -> sash -> sash profile -> 60 x 56 mm.

## What does not change

- catalogue dimensions or their values;
- canonical support/sash X/Y;
- profile raster position, scale or rotation;
- 8.5 mm system correction value or reference endpoints;
- overlap status;
- exact mate X/Y/rotation;
- topology, BOM, production or machine logic.

## Safety boundary

`ANNOTATION ANCHORS = VISUAL ONLY / NOT PRODUCTION GEOMETRY`

`UNKNOWN OVERLAP = EXPLICIT / NOT INVENTED`

`AUTOMATIC GEOMETRY = NO`

`RULES VALIDATED = NO`

`PRODUCTION AUTO-UNLOCK = NO`

`MACHINE READY = NO`

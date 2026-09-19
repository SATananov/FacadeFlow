# FIX48 — Final assembly presentation cleanup 01

## Goal

Finish the visual presentation of the reviewed final-assembly node after FIX47 without changing any assembly fact, profile placement, system value, or production boundary.

## Accepted scope

- The `8.5 mm` system-correction label is moved out of the dark profile section into a dedicated top annotation lane.
- The correction reference keeps the same two endpoints and the same `8.5 mm` value.
- The correction leader terminates at the annotation box without using the box itself as geometry.
- The two correction endpoint markers are reduced so they remain visible but do not dominate the section.
- The central system-rule axis remains visible as a review reference, but is thinner, more widely dashed, and lower contrast.
- Profile helper bounding rectangles remain available and are reduced further through lighter fill and line weight, while the accepted FIX47 dash/opacity contract stays unchanged.
- FIX47 contour-based profile identity and outer catalogue-dimension lanes remain unchanged.
- FIX45.2 semantic mapping remains unchanged:
  - `482.21` -> divider / mullion -> support profile -> 60 x 84 mm;
  - `482.05` -> sash -> sash profile -> 60 x 56 mm.

## What does not change

- catalogue dimensions or their values;
- canonical support/sash X/Y;
- profile raster position, scale or rotation;
- `8.5 mm` correction value or reference endpoints;
- system rule semantics;
- overlap status;
- exact mate X/Y/rotation;
- topology, BOM, production or machine logic.

## Safety boundary

`PRESENTATION CLEANUP = VISUAL ONLY`

`SYSTEM CORRECTION ENDPOINTS = UNCHANGED`

`ANNOTATION ANCHORS = VISUAL ONLY / NOT PRODUCTION GEOMETRY`

`UNKNOWN OVERLAP = EXPLICIT / NOT INVENTED`

`AUTOMATIC GEOMETRY = NO`

`RULES VALIDATED = NO`

`PRODUCTION AUTO-UNLOCK = NO`

`MACHINE READY = NO`

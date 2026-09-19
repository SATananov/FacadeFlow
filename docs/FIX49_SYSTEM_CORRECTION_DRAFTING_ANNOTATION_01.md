# FIX49 — System correction drafting annotation 01

## Goal

Close the visual prototype for the reviewed final-assembly node by keeping the `8.5 mm` system correction visible in the drawing without placing a UI-style card over either profile.

## Accepted scope

- The `8.5 mm` system-correction value remains visible directly in the technical drawing.
- Its text is placed in the free drafting lane immediately above the participating profile sections and to the left of the system axis.
- The annotation is text-only: no label rectangle is drawn over the section.
- A thin solid leader follows the existing system axis upward and then turns to the annotation.
- The same two correction reference endpoints and the same `8.5 mm` value are preserved.
- FIX48 quiet system axis, reduced endpoint markers and helper-bound styling remain preserved.
- FIX47 contour identity leaders and external 60/84/56 catalogue-dimension lanes remain preserved.
- FIX45.2 semantic mapping remains unchanged:
  - `482.21` -> divider / mullion -> support profile -> 60 x 84 mm;
  - `482.05` -> sash -> sash profile -> 60 x 56 mm.

## Technical presentation principle

Use the drafting hierarchy rather than copying a third-party interface: orientation and participants first, then a clean final section, with dimensions and rule annotations around the section rather than UI cards covering the geometry.

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

`SYSTEM CORRECTION ANNOTATION = VISUAL ONLY`

`SYSTEM CORRECTION VALUE / ENDPOINTS = UNCHANGED`

`ANNOTATION ANCHORS = VISUAL ONLY / NOT PRODUCTION GEOMETRY`

`UNKNOWN OVERLAP = EXPLICIT / NOT INVENTED`

`AUTOMATIC GEOMETRY = NO`

`RULES VALIDATED = NO`

`PRODUCTION AUTO-UNLOCK = NO`

`MACHINE READY = NO`

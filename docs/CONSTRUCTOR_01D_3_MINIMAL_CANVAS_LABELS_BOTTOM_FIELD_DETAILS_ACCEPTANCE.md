# CONSTRUCTOR 01D.3 — Minimal Canvas Labels + Bottom FIELD Details

## Goal
Keep the construction drawing visually clean while preserving all FIELD information in a dedicated area below the sketch.

## Acceptance
- The canvas shows only the numeric FIELD sequence (for example `1`, `2`, `3`) in a white circular badge.
- The word `ПОЛЕ`, dimensions, `FIX/КРИЛО`, opening mode and `ЛЯВО/ДЯСНО` are not rendered as canvas text.
- 01D.1 working opening symbols remain visible inside OPERABLE FIELD surfaces.
- A horizontal FIELD details panel lives below the sketch and above the status bar.
- Each FIELD card shows: sequence number, schematic width × height, semantic type, and opening mode/handing where applicable.
- Clicking a FIELD card selects the same canonical FIELD in the Constructor.
- The panel supports horizontal scrolling for modules with many FIELDs.
- Rectangle, triangle, trapezoid and polygon FIELD geometry remains unchanged.
- No profile, hardware or machine geometry is inferred.

## Safety boundary
PROFILE RESOLUTION: NO
HARDWARE RESOLUTION: NO
MACHINE READY: NO

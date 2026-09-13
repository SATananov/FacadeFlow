# CONSTRUCTOR TECHNICAL DRAWING 01.3.1 — Frame Edge Selection Cleanup

## Intent
Remove the wide cyan selection band that appears when a frame edge is selected, while preserving the existing generous edge hit-area and all frame interaction behavior.

## Accepted visual behavior
- The 16 px frame-edge interaction target remains available for click/drag behavior.
- The interaction target itself is visually transparent.
- The selected edge is indicated only by a thin technical line centered on the actual frame edge.
- No full-width/full-height cyan band is painted outside the frame.
- The indicator applies consistently to top, bottom, left and right edges.

## Boundaries
- Frame geometry: unchanged.
- Edge hit-area: unchanged.
- Edge selection semantics: unchanged.
- Drag / resize behavior: unchanged.
- Canonical dimensions and calculations: unchanged.
- Constructor TSX / domain / persistence: unchanged.
- AUTOMATIC GEOMETRY = NO.
- RULES VALIDATED = NO.
- MACHINE READY = NO.

Human browser review is required before commit/push.

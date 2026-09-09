# Constructor 01C.3.5 — Angled Divider + Polygon FIELD Topology

## Goal
Add a real angled construction divider without degrading FacadeFlow into a free-line CAD editor.

## Accepted behavior
- The tool **Ъглов делител** is enabled after a frame exists.
- Clicking a rectangular FIELD creates one angled construction split.
- The divider has independent top and bottom endpoints.
- Dragging the top grip changes only the top endpoint.
- Dragging the bottom grip changes only the bottom endpoint.
- Body drag moves both endpoints together while preserving the angle.
- The divider remains attached to the top and bottom boundaries of its parent FIELD.
- The two child FIELDs are real polygon / trapezoid FIELD objects, not rectangular visual approximations.
- FIELD hit testing respects the polygon.
- Divider face remains schematic 40 mm and read-only until profile resolution.
- Delete and Undo/Redo include angled-divider operations.
- Existing vertical/horizontal independent-divider behavior is preserved.
- Per-module drafts and module switching are preserved.

## Safety boundary
- PROFILE RESOLUTION: NO
- AUTOMATIC PRODUCTION GEOMETRY: NO
- MACHINE READY: NO

Further subdivision of polygon FIELDs is intentionally deferred to a later polygon-operations stage rather than approximated incorrectly.

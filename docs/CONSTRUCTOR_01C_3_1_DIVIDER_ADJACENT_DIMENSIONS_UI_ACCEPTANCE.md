# Constructor 01C.3.1 — Divider Adjacent Dimensions UI Acceptance

## Goal
Make the selected-divider properties panel immediately readable without changing construction behavior.

## Accepted behavior
- A selected **vertical divider** shows the clear schematic size **left of the divider**, the divider thickness, and the clear schematic size **right of the divider**.
- A selected **horizontal divider** shows the clear schematic size **above the divider**, the divider thickness, and the clear schematic size **below the divider**.
- The compact distribution readout is derived from the same canonical FIELD topology used by the Constructor; it is not a second source of geometry.
- The existing numeric input continues to edit the first-side clear size (left for vertical, top for horizontal).
- Divider body drag still changes position. Divider edge drag still changes thickness.
- Outer module size remains invariant while divider thickness is resized.
- The visual language remains FacadeFlow; no SkyGlazing UI is copied.

## Safety boundary
- PROFILE RESOLUTION: NO
- AUTOMATIC PRODUCTION GEOMETRY: NO
- MACHINE READY: NO

## Stage identity
This is a UI/read-model polish on top of Constructor 01C.3. No FIELD topology semantics are changed.

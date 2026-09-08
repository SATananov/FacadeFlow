# Constructor 01A.1 — Direct Entry / Free Sketch Foundation

## Goal
Allow FacadeFlow Constructor to open directly from the application header/home screen without creating an offer first, while preserving the existing offer → module → constructor route.

## Accepted flow

### Offer mode
Offer → Module 1 → Constructor

- Offer-level profile system, color, foil, glazing and hardware remain locked context.
- Constructor does not override offer invariants.

### Free mode
Home/Header → Constructor → Free Sketch

- No client is required.
- No object is required.
- No offer is required.
- No profile system is automatically selected.
- No color, foil, glazing or hardware is inferred.
- The user may continue from the free sketch toward a new offer and select technical configuration later.

## Shared engine rule
Free mode and offer mode use the same `ConstructorShell` component. They are different launch contexts, not two separate constructor implementations.

## Conversion foundation
A free constructor session exposes `Създай оферта от тази скица` and the offer form marks the source as the free constructor. Geometry transfer is intentionally not claimed in 01A.1 because parametric geometry begins in Constructor 01B.

## Safety boundaries
- PARAMETRIC FRAME: NO
- DIVIDER DRAG/RESIZE: NO
- AUTOMATIC PROFILE MAPPING: NO
- AUTOMATIC GEOMETRY: NO
- MACHINE READY: NO

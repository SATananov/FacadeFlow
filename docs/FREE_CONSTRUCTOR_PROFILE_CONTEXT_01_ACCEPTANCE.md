# FREE CONSTRUCTOR PROFILE CONTEXT 01

Profile System + Module Type in Free Constructor. Human visual acceptance pending.

## Module state

App owns each free module's `profileSystemId`, nullable `productType` and nullable
`ModuleProfileResolution`; existing sketch drafts remain keyed by module id.
Context survives module switches for the current App session. This stage adds no
browser-storage persistence or offer/client requirement.

- The first module starts with an empty system id, null type and null resolution.
- Systems are human-selected from `getSelectableProfileSystems()`; labels use
  manufacturer and name. There is no default PRELUDE selection.
- A new module inherits only the active system id, with a clean resolution,
  null product type and no sketch or profile assignments.
- Changing systems creates a clean resolution; clearing returns to SYSTEM NEUTRAL.
- Window/Door/Clear uses the existing product-type callback and profile engine.
  Reconciliation removes sash assignments incompatible with the new role.
- Reset clears only the active sketch and its assignments, retaining system/type.
  Other modules retain their context, assignments and sketch.

## Shared rendering and offer transfer

The shared Profile pane, candidates, progress, joint/overlap status, reviewed sash
placement and Profile View work with free context through the existing engine.
Profile View OFF remains schematic. All 01.1 evidence gates and render alignment
fixes remain in force.

Create-offer-from-free preserves the existing sketch-transfer route and prefills
only the selected system among offer settings. Client/object, color, foil,
glazing and hardware are not selected. Neutral free context leaves system empty.
Profile assignments are not copied into the offer.

## Verification and safety

`node scripts/verify-free-constructor-profile-context01.mjs` executes the actual
App state handlers and ConstructorShell rendering using an in-memory hook host.
Twelve grouped cases cover neutral defaults, catalogue selection, profile panes,
roles, reconciliation, module independence, reset, new modules, offer transfer
and reviewed placement/optional schematic rendering. Browser effects and layout
are not simulated; human visual review is still required.

The verifier runs through `npm run verify`, alongside the unchanged 01.1 runtime
suite. ConstructionModel, FIELD bounds and divider topology are not changed by
system/type selection. Profile assignments remain outside ConstructionModel.

- 01.1 fixes preserved: YES.
- Automatic profile/glazing selection: NO.
- Reviewed PRELUDE 60 semantics: 42 / 40 / 56 mm faces; 22 mm overlap, unchanged.
- Exact sash inset / glazing inset / glass cut: UNKNOWN.
- Polygon/angled sash geometry: DEFERRED.
- New production semantics / BOM / cut list: NO.
- MACHINE READY: NO.

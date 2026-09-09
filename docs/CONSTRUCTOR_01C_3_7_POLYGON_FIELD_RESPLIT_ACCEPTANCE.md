# Constructor 01C.3.7 — Polygon FIELD Re-split Acceptance

## Goal
After an angled divider creates triangle/trapezoid/polygon FIELDS, the user can continue construction instead of reaching a topology dead end.

## Accepted behavior
- A vertical divider can split a polygon FIELD.
- A horizontal divider can split a polygon FIELD.
- The divider body is clipped to the actual polygon boundary; it does not extend outside the FIELD.
- Both child FIELDS preserve real polygon geometry.
- A normal divider nested under an angled split remains movable by position only.
- Delete merges only that split back into its parent polygon FIELD.
- Undo / Redo continues to use the canonical ConstructionModel.
- Existing rectangular FIELD behavior is preserved.
- Existing angled endpoint and corner anchoring behavior is preserved.
- Angled-on-polygon re-split is intentionally deferred to a later generic line-split stage.

## Safety boundary
PROFILE RESOLUTION: NO
AUTOMATIC PRODUCTION GEOMETRY: NO
MACHINE READY: NO

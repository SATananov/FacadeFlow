# Constructor 01C.3.6 — Angled Corner Anchoring + Triangle FIELDs

## Goal
An angled-divider endpoint may reach the exact inner corner of its parent FIELD. The previous safety inset must not stop the grip 120–170 mm before the corner.

## Acceptance
- Top endpoint range is `0..parent FIELD width`.
- Bottom endpoint range is `0..parent FIELD width`.
- The final 30 mm near either side snaps to the exact inner corner.
- `0 mm` means exact left inner corner; full parent width means exact right inner corner.
- The 40 mm schematic divider face is clipped to the parent FIELD boundary instead of forcing the centerline away from the corner.
- Corner-to-corner geometry may resolve child FIELDs as real triangles.
- Non-corner geometry continues to resolve as polygon / trapezoid FIELDs.
- Top and bottom grips remain independent.
- Body drag keeps both endpoints inside the parent FIELD.
- Delete and Undo/Redo remain supported.
- Polygon re-split remains deferred.
- PROFILE RESOLUTION: NO.
- MACHINE READY: NO.

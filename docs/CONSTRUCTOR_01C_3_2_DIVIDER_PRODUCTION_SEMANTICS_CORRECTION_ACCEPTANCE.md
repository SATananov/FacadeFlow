# Constructor 01C.3.2 — Divider Production Semantics Correction

## Goal

Correct the experimental divider-thickness editing semantics after domain review. A divider belongs to its parent `ПОЛЕ / FIELD`: its span/length follows that FIELD automatically, while the operator changes only divider position. Face width is not a free drawing parameter.

## Accepted behavior

- Divider body drag changes **position only**.
- Numeric divider position remains editable.
- Direct pointer handles for divider thickness are removed.
- Numeric divider-thickness input is removed.
- Before Profile Resolution, every divider uses the canonical **40 mm schematic face**.
- Existing experimental 01C.3 divider faces are normalized back to the canonical 40 mm schematic face when cloned/upgraded.
- Divider span/length is automatically derived from the parent FIELD bounds for both vertical and horizontal dividers.
- Properties show divider length as read-only and explicitly say it comes from the parent FIELD.
- Properties show schematic face width as read-only and explicitly say a real width will later come from Profile Data / Profile Resolution.
- Vertical adjacent readout remains `LEFT FIELD + DIVIDER + RIGHT FIELD`.
- Horizontal adjacent readout remains `TOP FIELD + DIVIDER + BOTTOM FIELD`.
- Moving a divider consumes/returns FIELD space but never changes the outer module size.
- Undo / Redo and Delete remain available.

## Profile boundary

The 40 mm face is a neutral Constructor placeholder, not a production profile dimension. When Profile Resolution is implemented, divider face width must be derived from the selected compatible mullion/divider profile rather than from free user resizing.

## Safety boundary

- `PROFILE RESOLUTION: NO`
- `AUTOMATIC PRODUCTION GEOMETRY: NO`
- `MACHINE READY: NO`

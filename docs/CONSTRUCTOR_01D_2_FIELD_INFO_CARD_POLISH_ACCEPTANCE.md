# CONSTRUCTOR 01D.2 — FIELD Info Card Polish Acceptance

## Goal
Keep the 01D.1 opening symbols fully visible while making FIELD semantics readable and calm in the center of each FIELD.

## Acceptance
- `ПОЛЕ N`, dimensions, `FIX/КРИЛО`, opening mode, and `ЛЯВО/ДЯСНО` are grouped in one compact centered info card.
- The card masks opening lines only behind the text area; opening geometry remains visible around it.
- `Странично + падащо` is not truncated to an ellipsis in normal field widths.
- FIX fields show no opening symbol and keep the same compact card treatment.
- UNSET fields still show FIELD number + dimensions only.
- Polygon / triangle / trapezoid FIELD clipping remains owned by the FIELD surface; the info card is clipped with the FIELD.
- No geometry, topology, field semantics, opening semantics, profile resolution, hardware resolution, or machine output logic changes.

## Safety boundary
PROFILE RESOLUTION: NO
HARDWARE RESOLUTION: NO
MACHINE READY: NO

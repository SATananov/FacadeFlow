# Constructor 01D — FIELD Types + Visual Opening Acceptance

## Goal

Add canonical FIELD semantics on top of Constructor 01C.3.7 without changing the established parametric/polygon geometry model.

## Accepted behavior

- Every canonical Constructor FIELD can be `FIXED`, `OPERABLE`, or unset.
- `OPERABLE` means one logical sash exists in that FIELD. This is a semantic sash, not a profile-resolved production sash.
- The left toolbar contains enabled `Фиксирано поле` and `Отваряемо поле` tools. The operator chooses a tool and clicks the target FIELD.
- A selected FIELD can also change type from the Properties panel.
- Switching a FIELD to `FIXED` clears opening mode and left/right working handing.
- An `OPERABLE` FIELD can store one opening mode: `side-hinged`, `tilt`, or `tilt-turn`.
- Left/right working handing is available only for `side-hinged` and `tilt-turn`.
- `tilt` clears and does not accept left/right handing.
- Constructor 01D establishes the operable sash visualization slot without making profile/hardware decisions. The initial neutral visual is superseded by the working opening-symbol renderer in Constructor 01D.1.
- FIX / OPERABLE / opening mode / working handing are persisted in the canonical ConstructionModel FIELD definition.
- Semantic edits do not modify frame size, FIELD bounds, dividers, polygon geometry, or module dimensions.
- Existing rectangle, polygon, triangle and trapezoid FIELD topology remains valid.
- Splitting a semantic FIELD creates new child FIELDs without blindly inheriting FIX/opening assumptions; deleting the split may restore the lineage FIELD semantics.
- Constructor FIELD semantics synchronize back to the offer module by stable `constructionFieldId` and use `source = constructor`.
- When Constructor topology is authoritative, offer-side FIELD semantic controls are read-only to avoid two competing truths.
- A free Constructor module stores the same semantics inside its own Constructor draft and carries them into Module 1 when an offer is created from that sketch.

## Safety boundary

- OPERABLE VISUAL SLOT: CANONICAL
- WORKING OPENING SYMBOLS: DEFINED IN 01D.1
- PROFILE RESOLUTION: NO
- AUTOMATIC PRODUCTION GEOMETRY: NO
- MACHINE READY: NO

# PROFILE-AWARE JOINT GEOMETRY 01A — PRELUDE 60 REVIEWED OVERLAP

Status: **WORKING / REVIEWED FRONT-ELEVATION SEMANTICS**

## Purpose

Review one missing PRELUDE 60 joint semantic without inventing the rest of the assembled profile geometry.

This step accepts a **22 mm front-elevation sash/support overlap semantic** for the two currently recognized working pairs:

- `482.30 FRAME ↔ 482.05 SASH`
- `482.21 MULLION ↔ 482.05 SASH`

It does not yet move the sash in Constructor and it does not establish machine geometry.

## Evidence review

The reviewed PRELUDE 60 face semantics give the same 22 mm zone from three independent profile views:

- frame `482.30`: `64 - 42 = 22 mm`
- sash `482.05`: `78 - 56 = 22 mm`
- mullion `482.21`: `(84 - 40) / 2 = 22 mm` on each side

The agreement is accepted only as the **front-elevation overlap zone** for the current PRELUDE 60 frame-sash and mullion-sash working joints.

The current `/series 60mm/` catalogue callout for `482.05` is recorded as `60 / 78 / 56 mm`; the earlier foundation document remains historical evidence of the pre-review state.

## Read-model behavior

The joint read model may now expose:

- `sashOverlapMm = 22`
- evidence status = `catalogue-overlap-reviewed`

while still keeping the full joint unresolved.

The inspector shows the reviewed overlap separately and may report `ЗАСТЪПВАНЕ ПОТВЪРДЕНО`, while the complete joint remains evidence-gated.

## Still UNKNOWN

- `sashInsetMm`: **UNKNOWN**
- `glazingInsetMm`: **UNKNOWN**
- exact profile reference-line placement: **UNKNOWN**
- rebate / cut deduction: **UNKNOWN**
- production tolerance: **UNKNOWN**
- machining coordinates: **UNKNOWN**

A 22 mm overlap is not permission to infer any of those values.

## Safety boundary

- Full joint status `resolved` still requires `human-confirmed-assembly` plus overlap, sash inset and glazing inset.
- Existing profile-aware sash renderer remains gated by human-confirmed semantics.
- Constructor topology is unchanged.
- Constructor geometry mutation: **NO**.
- Automatic sash movement from the 22 mm value: **NO**.
- BOM / CUT LIST / MACHINE: **NO**.
- Production approved: **NO**.
- MACHINE READY: **NO**.

## Next step

Obtain/review assembled section evidence that establishes the exact sash reference-line inset and glazing inset for `482.30 ↔ 482.05` and `482.21 ↔ 482.05`. Only then may FacadeFlow promote the joint to fully resolved profile-aware geometry.

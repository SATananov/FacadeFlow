# PROFILE-AWARE JOINT GEOMETRY 01 — PRELUDE 60 FOUNDATION

Status: **WORKING / EVIDENCE-BOUND FOUNDATION**

## Purpose

Move FacadeFlow away from fixed-pixel visual guessing and toward real profile-system assembly geometry.

This step identifies which structural profile borders each side of an OPERABLE ПОЛЕ and resolves the expected joint pair:

- `FRAME ↔ SASH`
- `MULLION ↔ SASH`

for the current PRELUDE 60 working profiles.

## Verified component evidence

The PRELUDE 60 catalogue page 2 confirms the individual profile identities and raw printed callouts:

- `482.30` = frame / каса — raw callouts `60 / 64 / 42 mm`
- `482.05` = sash / крило — raw callouts `60 / 56 / 56 mm`
- `482.21` = mullion / делител — raw callouts `60 / 84 / 40 mm`

These component callouts are evidence. They are **not** automatically converted into overlap, rebate, sash inset, glazing inset or cut deductions.

A current KMG `/series 60mm/` sectional drawing has been located for the assembled `482.30 + 482.05` context. Its callouts are not yet semantically reviewed in FacadeFlow, so the exact assembled overlap remains unknown.

## Joint registry

The foundation registers the two current working pairs:

- `482.30 FRAME ↔ 482.05 SASH`
- `482.21 MULLION ↔ 482.05 SASH`

Registration means that FacadeFlow recognizes the intended evidence context. It does **not** mean that assembly dimensions are already confirmed.

## Topology mapping

For rectangular OPERABLE fields, each boundary is classified from the authoritative Constructor topology:

- outer interior boundary → frame joint;
- boundary on the leading/trailing face of a normal divider → mullion joint.

Angled/polygon field joint reconstruction remains explicitly unsupported in this step rather than being approximated as rectangular geometry.

## UI behavior

The Profile inspector shows a new Bulgarian `ПРОФИЛНИ ВЪЗЛИ` read model for the selected OPERABLE field:

- side: ЛЯВО / ДЯСНО / ГОРЕ / ДОЛУ;
- support: КАСА / ДЕЛИТЕЛ;
- selected support profile ↔ selected sash profile;
- exact overlap / inset only when confirmed;
- otherwise `НЕИЗВЕСТНО` and `НУЖЕН ПОТВЪРДЕН СРЕЗ`.

The compact inspector progress exposes `ВЪЗЛИ resolved/required`.

## Safety boundary

- `sashOverlapMm`: **null** until human-confirmed assembly semantics exist.
- `sashInsetMm`: **null** until human-confirmed assembly semantics exist.
- `glazingInsetMm`: **null** until human-confirmed assembly semantics exist.
- No arithmetic such as visible-face differences is accepted as assembly truth.
- Constructor geometry is not mutated by this step.
- Existing PROFILE RESOLUTION 01C rule remains: sash profile-aware geometry stays unresolved until all required semantics are confirmed.
- BOM / CUT LIST / MACHINE: **NO**.
- MACHINE READY: **NO**.

## Next evidence step

Interpret and human-confirm the real PRELUDE 60 sectional drawing(s), then record exact assembly semantics as reviewed data. Only after that may the profile-aware renderer consume those values for real sash overlap/inset geometry.

# GLAZING EVIDENCE 01 — PRELUDE 60 Bead & Glazing Context Foundation

## Scope

This stage records only catalogue-stated glazing-bead thickness context for KMG PRELUDE 60 and exposes a fail-closed evidence resolver. It does not create glazing geometry and does not choose a glazing bead automatically.

## Reviewed catalogue evidence

Source: **KMG PVC Profiles Systems**, PRELUDE 60, catalogue page 2, section **Glass beads**.

- `482.14` — **4 mm**
- `549.10` — **14 mm**
- `482.15` — **24 mm**
- `482.01` — **24 mm**
- `482.22` — **32 mm**

These are system-scoped catalogue labels. They are not global meanings of the physical code. The same codes are reused in **PRESTIGE 70 with different nominal glazing labels** (for example `482.15` is 34 mm and `482.22` is 42 mm there), so a code without its system context is insufficient evidence.

## Resolution semantics

A human-confirmed glazing thickness may produce zero, one, or several **catalogue candidates** inside PRELUDE 60. Candidate status does not prove that the bead is compatible with a concrete frame/sash profile.

- bead-to-frame/sash compatibility: **UNCONFIRMED**
- automatic bead selection: **NO**
- exact glazing inset: **UNKNOWN**
- glass cut: **UNKNOWN**
- rebate/falz geometry: **UNKNOWN**
- ConstructionModel mutation: **NO**
- topology / FIELD bounds mutation: **NO**
- BOM / cut list: **NO**
- MACHINE READY: **NO**

## Fail-closed rules

- Missing glazing thickness returns no candidate.
- Unsupported systems do not consume PRELUDE 60 evidence.
- Catalogue evidence and the selected system catalog entry must agree on code, stated thickness, document, page, and section.
- An integrity mismatch returns no promoted candidate.
- A candidate never becomes an automatic assignment.

## Safety boundary

GLAZING INSET: **UNKNOWN**

GLASS CUT: **UNKNOWN**

MACHINE READY: **NO**

## Deferred

A later reviewed assembly source is required before FacadeFlow may derive an exact glazing inset, glass plane, gasket/rebate relationship, or glass cut dimension.

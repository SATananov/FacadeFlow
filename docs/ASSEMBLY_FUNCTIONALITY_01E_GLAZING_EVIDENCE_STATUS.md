# ASSEMBLY FUNCTIONALITY 01E — GLAZING EVIDENCE STATUS

## Purpose

01E makes glazing knowledge explicit per actual joint occurrence. It does **not** position glass or glazing bead geometry. It separates four levels that must never be collapsed into one another:

1. FIELD glazing input context.
2. Catalogue evidence that a selected bead code is stated for the selected nominal glazing thickness.
3. Reviewed bead-to-base-profile compatibility.
4. Reviewed placement / glazing inset / seat / glass-cut geometry.

## Evidence gates

- `INPUT CONTEXT != CATALOGUE EVIDENCE`
- `CATALOGUE EVIDENCE != BEAD-TO-BASE COMPATIBILITY`
- `COMPATIBILITY != PLACEMENT`
- `PLACEMENT != GLASS CUT DIMENSIONS`

A PRELUDE 60 catalogue record such as bead `482.15` stated for 24 mm glazing can raise the joint evidence tier to `catalogue-supported` only when the selected bead/thickness pair is source-backed. This does not prove that `482.15` is compatible with sash `482.05` or frame `482.30` unless a separate reviewed compatibility rule exists.

## Fail-closed behavior

- Missing / invalid 01D linkage -> evidence tier `blocked`.
- Complete FIELD context but no source-backed bead/thickness candidate -> `input-context` only.
- Source-backed bead/thickness candidate -> `catalogue-supported`.
- Reviewed bead-to-base rule -> `compatibility-reviewed`.
- Placement review is a separate future gate; 01E keeps placement and glass-cut status `unknown`.

## UI

The assembly workspace shows a module-level `ДОКАЗАТЕЛСТВА ЗА ОСТЪКЛЯВАНЕ · 01E` panel and a selected-joint `GLAZING EVIDENCE КЪМ ВЪЗЕЛА · 01E` panel. The catalogue source is visible when present.

## Safety boundary

- Exact glazing inset: UNKNOWN.
- Exact glazing seat: UNKNOWN.
- Bead placement in section: UNKNOWN.
- Glass cut dimensions: UNKNOWN.
- `AUTOMATIC GEOMETRY = NO`
- `RULES VALIDATED = NO`
- `MACHINE READY = NO`

01E is evidence/status infrastructure only. It must not mutate construction topology, joint coordinates, profile placement, glazing geometry, BOM or machine output.

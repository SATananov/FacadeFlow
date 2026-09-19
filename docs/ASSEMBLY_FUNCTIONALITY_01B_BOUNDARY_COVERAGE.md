# ASSEMBLY FUNCTIONALITY 01B — BOUNDARY COVERAGE

## Goal

Turn the 01A boundary-driven technical-section resolver into an explicit coverage model for every side that requires a sash joint.

For each **OPERABLE ПОЛЕ (FIELD)** FacadeFlow now expects exactly four boundary checks:

- left
- right
- top
- bottom

A FIXED or UNSET field does not create false sash-boundary requirements.

## Resolution chain

`OPERABLE FIELD -> EDGE -> SUPPORT (FRAME / STRAIGHT DIVIDER) -> REAL PROFILE PAIR -> TECHNICAL SECTIONS -> SYSTEM RULE -> SYSTEM TECHNICAL PREVIEW`

01B does not silently discard an expected side. If the side cannot be resolved safely, the coverage read model keeps an explicit blocked record.

## Explicit boundary statuses

- `resolved` — support, real profiles, registered technical sections and system rule are all available for a **system technical preview**.
- `support-unresolved` — the FIELD side cannot be mapped safely to frame or a straight divider. No joint is fabricated.
- `missing-profile` — topology support exists, but a real support/sash profile assignment is missing.
- `invalid-role` — selected catalogue roles do not match the boundary role.
- `missing-technical-section` — the real profile exists in the catalogue but there is no reviewed technical-section registration. **No substitute geometry is generated.**
- `missing-system-rule` — reviewed technical sections exist, but no system construction rule matches the pair/context.

## Current PRELUDE 60 checked family

For the currently reviewed 01A section family:

- Frame 482.30 <-> Sash 482.05
- Mullion 482.21 <-> Sash 482.05

The reference rule remains side-sensitive:

- left: 8.5 mm
- right: 8.5 mm
- top: 8 mm
- bottom: 8 mm

These values are reference system corrections. They are **not overlap and not production mate geometry**.

## Multi-FIELD behavior

Every OPERABLE FIELD owns four expected boundary checks. A shared straight divider can therefore resolve as the support for the right edge of one FIELD and the left edge of its neighbor. FIXED fields do not create sash-joint coverage.

Angled/polygon support remains intentionally unsupported by this resolver. 01B exposes the expected sides as blocked instead of reducing the boundary count.

## User-facing acceptance

The Assembly Review shows a dedicated `ПОКРИТИЕ НА ГРАНИЦИТЕ · 01B` section. For each operable FIELD, all four sides are visible with a status. Resolved sides can open their joint detail. Blocked sides remain visible with the reason available as the item title.

The module summary now distinguishes:

- topology boundary resolution;
- technical preview coverage;
- exact verified assembly geometry.

These are separate knowledge levels.

## Safety boundary

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- PRODUCTION AUTO-UNLOCK = NO
- MACHINE READY = NO

01B is a boundary-coverage and fail-closed resolution stage. It does not infer overlap, glazing inset, exact mate coordinates, cutting lengths, BOM output, CNC output, or machine-ready geometry.

# PROFILE RESOLUTION 02A — SYSTEM COMPONENT + COMPATIBILITY FOUNDATION

## Goal
Extend the clean 01C.1 checkpoint with the first production-domain concepts learned from the SkyGlazing architecture without copying its code/data model and without mutating Constructor topology or enabling machine output.

## Accepted architecture
- `ConstructionModel` remains topology/geometry authority.
- `ModuleProfileResolution` remains outside ConstructionModel.
- `ProfileSystemCatalogEntry` is generalized for future manufacturers/materials.
- A normalized `ProfileSystemComponentInventory` read model prepares a future Profile Data Studio/import pipeline without replacing source catalog evidence.
- Structural profile assignments remain human-only.
- 02A adds human-only `fieldGlazingBeads` and `reinforcements`.
- Compatibility has explicit `VALID / INVALID / UNCONFIRMED / MISSING DATA` semantics.
- Glazing-bead candidate matching uses only explicit `statedGlassMm` catalog evidence.
- Reinforcement candidate matching uses only explicit `appliesToProfileCodes` + thickness options.
- Structural profile-pair compatibility remains UNCONFIRMED until a reviewed rule exists.
- Hardware requirements are derived from FIELD semantics but NO concrete hardware kit is auto-selected.
- Opening Groups receive a human-only domain foundation for future active/passive sash semantics; no inferred grouping is generated.

## UI
Selected elements expose only data supported by the current catalog:
- FRAME / MULLION: main profile + compatible reinforcement candidates.
- OPERABLE FIELD: sash + compatible reinforcement + glazing bead + hardware requirements.
- FIX FIELD: glazing bead + hardware not-applicable state.
- Supplemental BEAD / REINF counters do not change the canonical structural profile `assigned/required` progress.

## Safety boundaries
- AUTOMATIC PROFILE SELECTION: NO
- AUTOMATIC GLAZING-BEAD SELECTION: NO
- AUTOMATIC REINFORCEMENT SELECTION: NO
- AUTOMATIC HARDWARE KIT: NO
- STRUCTURAL PAIR COMPATIBILITY ASSUMPTION: NO
- GLAZING DEDUCTIONS: NO
- BOM: NO
- CUT LIST: NO
- MACHINE READY: NO
- CONSTRUCTOR TOPOLOGY / GEOMETRY MUTATION: NO

## SkyGlazing lesson retained
Use separate system data + compatibility + production layers, but keep FacadeFlow's modern separation of topology, resolution, dimensional semantics and future machine adapters.

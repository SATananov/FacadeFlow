# KMG 482.30 ↔ 482.05 Frame-to-Sash Evidence Acquisition 01

## Scope and result

Target: KMG PRELUDE 60, `482.30` Frame ↔ `482.05` Sash, `FRAME_TO_SASH`.

**No new direct evidence closes the physical joint.** The pair remains unsuitable for physical display geometry and machining geometry. This report records evidence and source gaps only; no production evidence model or gate was changed.

## Existing evidence reviewed

- `src/data/profileSystems/jointSemantics.ts`: exact frame/sash pair registration, but overlap and inset remain `null`.
- `src/data/profileSystems/glazingEvidence.ts`: ALTEST page-23 sectional candidate, printed page 23 / PDF viewer page 24, sections 1–2, `482.30 · 482.05 · 482.15 · 24 mm`; candidate remains unreviewed and non-promoting.
- `src/data/profileSystems/assemblyJointPresentationTemplates.ts`: page-23 presentation offsets and visible overlap; explicitly operator-sketch values, not production rules.
- `src/data/profileSystems/assemblyGlazingSeatTemplates.ts`: presentation anchors only; glass cut, seat, inset, and machining remain unknown.
- `src/data/profileSystems/systemConstructionRules.ts`: reference construction corrections and `Assembly_Use_Rabbet`; explicitly not proof of exact profile placement, overlap, or machining.
- `src/data/profileSystems/systemStandards.ts`: unresolved `482.30` versus `482.30-K` database conflict.
- Existing assembly/evidence acceptance docs and catalogue assets: all preserve the same boundary.

## Local source search

Read-only searches covered:

- `C:\Users\stana\Desktop\Nadejda`
- `C:\Users\stana\Desktop\AltestExtract`
- `C:\Users\stana\Desktop\KMG_Altest_Current_Audit01`
- `C:\Users\stana\Desktop\Nadejda\SkyGlazing2018_EXTRACTED`
- `C:\Users\stana\Desktop`

The only relevant external extracted text hit outside the repository was `SkyGlazing2018_EXTRACTED\SkyGlazing2018\Config\ETK_Par.txt`, which contains generic parameter names such as `<FRAMETYPE>` and `<GASKET>`, not target profile or assembly evidence. No local `482.30`/`482.05` fabrication drawing, CAD/DXF/DWG, gasket detail, or assembly manual was found. The recovered local catalogue remains:

`C:\Users\stana\Desktop\Nadejda\PVC Prelude_bg.pdf`  
SHA-256: `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`

## External source search

| Source | Direct finding | Classification | Does not prove |
|---|---|---|---|
| `https://altestgroup.com/pdf/system/39/en.pdf` — Altest/KMG, `KMG PVC WINDOWS & DOORS SYSTEMS`, 6-page manufacturer PDF | Main-profile sheet lists `482.30 frame`, `482.05 sash`, and PRELUDE 60 profile callouts as isolated sections. | `PRIMARY_MANUFACTURER_PROFILE_EVIDENCE` | No exact assembled 482.30 ↔ 482.05 section, contact, seating, rebate, gasket placement, cut, or machining. |
| `https://altestgroup.com/pdf/system/40/bg.pdf` — Altest/KMG `/series 60mm/` catalogue referenced by repository evidence | Repository provenance identifies printed page 23 / PDF viewer page 24, sections 1–2, naming `482.30`, `482.05`, and `482.15` in one dimensioned 24 mm sectional context. | `PRIMARY_MANUFACTURER_ASSEMBLY_EVIDENCE` for pair context, `PARTIAL_ASSEMBLY_EVIDENCE` for physical semantics | The inspected repository record explicitly keeps the candidate unreviewed; exact contact, depth, overlap, rebate, gasket placement, cut, and machining remain unresolved. |
| `https://visionplast.com/wp-content/uploads/2019/07/pvc_kmg.pdf` — reseller-hosted KMG brochure | Repeats PRELUDE profile list and accessory/reinforcement listings. | `OFFICIAL_DISTRIBUTOR_TECHNICAL_EVIDENCE` / `INSUFFICIENT_FOR_GEOMETRY` | No exact frame-to-sash assembly detail. |
| `https://carega.ro/files/KMG-pliant.pdf` — reseller-hosted brochure copy | Repeats isolated profile sections and reinforcement/accessory information. | `OFFICIAL_DISTRIBUTOR_TECHNICAL_EVIDENCE` / `INSUFFICIENT_FOR_GEOMETRY` | No exact pair interface or machining detail. |

The official Altest PDF confirms profile identity, but its extracted content does not expose a dimensioned 482.30 ↔ 482.05 assembly. The page-23 source-bound candidate is therefore still only partial assembly evidence. [Altest’s official KMG PDF](https://altestgroup.com/pdf/system/39/en.pdf) lists the two profiles separately and does not close the interface.

## Identifier review

### 482.30

`482.30` is directly identified as a PRELUDE/KMG frame in the manufacturer catalogue and in the page-23 source-bound candidate. Status: **VERIFIED as a catalogue identifier**.

### 482.30-K

`482.30-K` appears in imported database/D0B0/D6-derived records as a frame variant/reference. No manufacturer source found in this search uses `482.30-K` for the page-23 PRELUDE section. Status: **AMBIGUOUS**.

### 482.30 versus 482.30-K

Status: **UNRESOLVED**. Repository evidence records an explicit conflict: comments name `482.30`, while D0B0/D6 frame records name `482.30-K`; the project does not prove that they are aliases or interchangeable. The construction rule preserves both as `frameProfileCode: 482.30` and `frameReferenceVariantCode: 482.30-K`, which is not manufacturer proof of identity.

### 482.05

`482.05` is directly identified as a PRELUDE/KMG sash in the manufacturer catalogue and page-23 candidate. Status: **VERIFIED as a catalogue identifier**.

## Physical fact matrix

| Fact | Status | Evidence basis / gap |
|---|---|---|
| Profile A identity | `VERIFIED` | Manufacturer catalogue identifies `482.30` as frame. |
| Profile B identity | `VERIFIED` | Manufacturer catalogue identifies `482.05` as sash. |
| Pair binding | `VERIFIED` | Page-23 candidate names `482.30 + 482.05 + 482.15` in one sectional context. |
| Assembly cross-section | `PARTIAL` | A source-bound sectional drawing exists, but the repository keeps its physical interpretation unreviewed. |
| Contact surfaces | `UNKNOWN` | No direct documented interface surfaces are recorded. |
| Seating relationship | `UNKNOWN` | Relative section context is not an explicit seating rule. |
| Contact depth / clearance | `UNKNOWN` | No direct interface measurement accepted. |
| Front overlap | `UNKNOWN` | Presentation overlap is not production overlap. |
| Rebate | `UNKNOWN` | Reference `Assembly_Use_Rabbet` is not direct physical proof. |
| Gasket / seal placement | `UNKNOWN` | Gasket/profile listings do not bind placement in this exact assembly. |
| Relative position | `PARTIAL` | The page-23 sectional context shows a relative arrangement, but exact production coordinates are not accepted. |
| End treatment | `UNKNOWN` | No direct frame/sash end detail. |
| Cut relationship | `UNKNOWN` | No fabrication or cut document. |
| Machining / hardware clearance | `UNKNOWN` | No direct machining or hinge-clearance source. |

The possible `482.05` envelope conflict is **UNRESOLVED**: imported database evidence records `profileW = 60`, `profileZ = 78`, while the public Altest PDF extraction presents a different callout grouping (`60 × 56 / 56`). The sources were not silently reconciled, and neither envelope is used to derive joint geometry.

## Current gate and promotion

Current physical gate: **UNKNOWN / not applicable to this FRAME_TO_SASH context**. The existing gate contract is focused on the explicit frozen `FRAME_TO_MULLION` case and was not changed here.

Would the evidence support promotion now? **NO.** Contact surfaces, seating, depth, overlap, rebate, gasket placement, end treatment, cut relationship, and machining/hardware facts remain unresolved. Physical display geometry and machine geometry are both **NO**.

## Exact source needed next

Recover one of the following with both article IDs explicitly bound:

- dimensioned manufacturer frame-to-sash assembly cross-section;
- original fabrication/workshop drawing for `482.30` + `482.05`;
- manufacturer CAD/DXF/DWG assembly with article metadata;
- manufacturer gasket/rebate/closing detail tied to these two profiles;
- authoritative identifier mapping proving or disproving `482.30-K` equivalence to `482.30`.

No production code, `geometryFacts.ts`, or `physicalGeometryGate.ts` was modified.

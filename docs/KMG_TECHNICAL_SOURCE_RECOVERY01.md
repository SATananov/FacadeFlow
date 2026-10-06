# KMG Technical Source Recovery 01

## Scope

Read-only recovery of document references for KMG PRELUDE 60 profiles `482.20`, `482.21`, accessory `KM242`, and the `FRAME_TO_MULLION` relationship.

No production code, runtime geometry, profile assignment, or relationship evidence was changed. Unknown physical facts remain unknown.

## Repository state

- Branch: `ai-agent-test`
- HEAD: `b73a58d`
- Preserved untouched: `FacadeFlow_GLOBAL_GUIDANCE_01_20260928.zip`

## Sources searched

Filesystem sources:

- `C:\Users\stana\Desktop\AltestExtract`
- `C:\Users\stana\Desktop\KMG_Altest_Current_Audit01`
- `C:\Users\stana\Desktop\Nadejda`
- `C:\Users\stana\Desktop\Nadejda\SkyGlazing2018_EXTRACTED`
- repository `docs`, `src`, and `scripts`

The current and legacy Altest profile databases were already compared in the preceding package audit. The target `items`, `standardoperations`, and `standart` evidence is unchanged between the current and legacy main databases.

Website sources:

- `https://skyglazing.com/download/` — official package download page
- `https://altestgroup.com/pdf/system/39/bg.pdf` — public KMG technical PDF
- `https://visionplast.com/wp-content/uploads/2019/07/pvc_kmg.pdf` — secondary-hosted KMG brochure candidate
- `https://www.scribd.com/document/96687366/kmg` — secondary catalogue mirror

Searches covered document extensions, filenames, database text references, KMG identifiers, and English/Bulgarian assembly, connector, fabrication, machining, and section terms.

## Recovered public technical PDF

Source URL: `https://altestgroup.com/pdf/system/39/bg.pdf`

- Source type: PDF, six pages
- Local working copy: `C:\Users\stana\Desktop\KMG_Technical_Source_Recovery01\altest-system-39-bg.pdf`
- Size: `3,127,921` bytes
- SHA-256: `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`
- Classification: `OFFICIAL_DOCUMENT_REFERENCE` / `SUPPORTING_TECHNICAL_EVIDENCE`
- Provenance: public KMG/Altest technical-system PDF; exact hash match to `C:\Users\stana\Desktop\Nadejda\PVC Prelude_bg.pdf`

Page 2 directly documents:

- `KM242` — “mullion connector for 482.21”
- reinforcement/profile compatibility for `482.20` and `482.21`
- PRELUDE 60 mm system context

What it does not document:

- no assembled 482.20 ↔ 482.21 drawing
- no connector placement detail relative to the frame
- no contact surfaces or contact depth
- no overlap, rebate, notch, cut angle, cut length, or machining contour
- no fabrication or workshop instruction for the joint

The exact hash match means this is corroborating provenance for the already recovered catalogue, not a new geometry source.

## Local help-document references

The legacy 2018 installer log contains:

```text
Made Dir: C:\SkyGlazing2018\Download\Help
File Copy: C:\SkyGlazing2018\Download\Help\NHD.pdf
File Copy: C:\SkyGlazing2018\Download\Help\NVD.pdf
```

Recovered files:

| File | Path | Size | SHA-256 | Classification |
|---|---|---:|---|---|
| `NHD.pdf` | `C:\Users\stana\Desktop\Nadejda\SkyGlazing2018_EXTRACTED\SkyGlazing2018\Download\Help\NHD.pdf` | 696,671 bytes | `7C8411106849BD88ACDB960A2A0E0D7C4A5BDF9C89FC450DCAC4FBF5B38DF4CE` | `HELP_REFERENCE` |
| `NVD.pdf` | `C:\Users\stana\Desktop\Nadejda\SkyGlazing2018_EXTRACTED\SkyGlazing2018\Download\Help\NVD.pdf` | 664,058 bytes | `87E712BA2DBBF16A88594E919F141BA2324073848E77A9B344F0EDB2BA9650C0` | `HELP_REFERENCE` |

The installer README identifies these resources as graphical-help support in the older application environment and separately mentions a Users’ Manual and Autodesk Volo View for graphical help. No text-searchable occurrence of `482.20`, `482.21`, or `KM242` was recovered from the PDF binaries.

### Page-by-page visual inspection

Both PDFs were rendered and visually inspected in full.

- `NHD.pdf`, page 1: Bulgarian graphical help for placing a horizontal inclined divider, with right-end-down and right-end-up examples. The page shows application screenshots of a rectangular frame, a diagonal divider, UI controls, and dimension inputs such as `200`, `1600`, and `1800` mm.
- `NVD.pdf`, page 1: Bulgarian graphical help for placing a vertical inclined divider, with bottom-end-right and bottom-end-left examples. The page shows application screenshots of a rectangular frame, a diagonal divider, UI controls, and dimension inputs such as `200`, `600`, and `800` mm.

Page classification: `POTENTIALLY_RELEVANT_UNBOUND_DRAWING` and `GENERIC_TECHNICAL_HELP`. The screenshots depict divider placement, but do not identify `482.20`, `482.21`, `KM242`, PRELUDE 60, or a KMG article/system. The highlighted divider endpoints are interface annotations; they are not a documented frame-to-mullion section, connector placement, notch, rebate, or machining detail.

Visual inspection result: `NHD.pdf` and `NVD.pdf` contain no target-bound geometry evidence. The generic diagonal-divider images must not be used to infer the KMG 482.20 ↔ 482.21 joint.

## Database document references

The relevant database references previously recovered from the main Altest MDB are stored in `standart.variables` for KMG configuration records:

| Stored filename | Database/table context | Local file found | Classification |
|---|---|---|---|
| `ДЕП 60мм window.pdf` | `standart.Name=KMG 4K` and `KMG 4K - каса от делител`, field `variables` | No | `CERTIFICATION_REFERENCE` / `MISSING_REFERENCED_SOURCE` |
| `ISO_KMG_2026 bg.pdf` | `standart.Name=KMG 4K` and `KMG 4K - каса от делител`, field `variables` | No | `CERTIFICATION_REFERENCE` / `MISSING_REFERENCED_SOURCE` |
| `ELTRAL високо отваряне сертификат.pdf` | `standart.Name=KMG 4K` and `KMG 4K - каса от делител`, field `variables` | No | `CERTIFICATION_REFERENCE` / `MISSING_REFERENCED_SOURCE` |
| `ENDOW.pdf` | `standart.Name=KMG 4K` and `KMG 4K - каса от делител`, field `variables` | No | `CERTIFICATION_REFERENCE` / `MISSING_REFERENCED_SOURCE` |
| `Розенхайм KMG 60мм.pdf` | `standart.Name=KMG 4K` and `KMG 4K - каса от делител`, field `variables` | No | `CERTIFICATION_REFERENCE` / `MISSING_REFERENCED_SOURCE` |
| `Серт. Endow на БГ.pdf` | `standart.Name=KMG 4K` and `KMG 4K - каса от делител`, field `variables` | No | `CERTIFICATION_REFERENCE` / `MISSING_REFERENCED_SOURCE` |
| `Сертификат Метал.pdf` | `standart.Name=KMG 4K` and `KMG 4K - каса от делител`, field `variables` | No | `CERTIFICATION_REFERENCE` / `MISSING_REFERENCED_SOURCE` |
| `Серт.обков GU.pdf` | `standart.Name=KMG 4K` and `KMG 4K - каса от делител`, field `variables` | No | `CERTIFICATION_REFERENCE` / `MISSING_REFERENCED_SOURCE` |

These are certification/document references. Their contents were not recovered, and their names alone do not establish that they contain profile sections or joint geometry.

The target `items` records have empty `cadfile` and help-document fields. No database URL, DXF/DWG filename, CAD attachment, fabrication-manual filename, or KM242 drawing filename was found in the audited target fields.

## KM242 findings

Evidence found:

- database item `KM242`: `Сглобка за дел. KMG 4к`, accessory relation, `WorkOperationsSet=Обков PVC делител`
- public technical PDF page 2: `KM242` is labelled as a mullion connector for `482.21`

Classification: `OFFICIAL_DOCUMENT_REFERENCE` / `SUPPORTING_TECHNICAL_EVIDENCE`.

Missing:

- physical KM242 drawing
- installation or fixing detail
- exact placement relative to 482.20
- compatible frame/mullion assembly sketch
- machining template

The connector label does not prove how it seats in the frame or establish any hidden joint dimensions.

## Fabrication and machining references

No direct fabrication manual, workshop manual, machining sheet, milling template, T-joint drawing, or connector installation instruction was recovered.

`SglobkaDelitel`, `BeamHorizontalKMG4k`, `BeamVerticalKMG4k`, operation `19`, `POS[]`, `MM1`, and `MM4` remain `DATABASE_RELATIONSHIP_EVIDENCE`. They are not document references proving physical geometry.

## Evidence status

- 482.20 technical source: `PARTIAL` — isolated catalogue/profile evidence only
- 482.21 technical source: `PARTIAL` — isolated catalogue/profile evidence only
- KM242 technical source: `PARTIAL` — connector identity and 482.21 association only
- 482.20 ↔ 482.21 assembly source: `MISSING`
- primary geometry evidence for the exact assembled joint: `NO`

Still unknown:

- contact line and contact point
- contact depth and overlap
- rebate and notch contour
- cut angle and cut length
- machining geometry
- assembled cross-section

## Source gaps and next action

The highest-value missing sources are:

1. the original fabrication/workshop manual for PRELUDE 60;
2. a KM242 installation or connector-detail sheet;
3. a manufacturer CAD/DXF/DWG section or T-joint drawing;
4. the missing KMG certification PDFs, inspected only for possible technical annexes;
5. the full graphical-help/manual package associated with the older installer.

No production evidence record was updated because no source directly proves the 482.20 ↔ 482.21 assembly geometry.

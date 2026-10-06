# Geometry Evidence Acquisition 02 — Source Gap Search

Scope: KMG PRELUDE 60 `482.20` Frame / `482.21` Mullion. This is a source
search and classification record only. It does not generate geometry or
promote any unknown fact to verified geometry.

## Result

No `PRIMARY_GEOMETRY_EVIDENCE` was found for the exact `482.20` ↔ `482.21`
frame-to-mullion assembly. The available evidence remains split between
isolated catalogue sections and database relationship records.

## Source inventory and classification

| Repository path | Source type | Profile IDs | What it proves | What it does not prove | Classification |
|---|---|---|---|---|---|
| `src/assets/catalog/prelude60/prelude60-catalog-page2.png` | Catalogue image, page 2 | `482.20`, `482.21` | The KMG PRELUDE 60 page visibly identifies both isolated profile sections and printed envelope/callout dimensions: `482.20` 60/68/46 and `482.21` 60/84/40. | No assembled frame↔mullion contact, seating, overlap, rebate, notch, cut, machining, or pair-specific cross-section. | `SUPPORTING_PROFILE_EVIDENCE` |
| `src/assets/catalog/prelude60/482-21-mullion-page2.png` | Extracted catalogue image, page 2 | `482.21` | The isolated mullion section and its printed 84/40/60 callouts are visible. | No relation to `482.20` and no joint geometry. | `SUPPORTING_PROFILE_EVIDENCE` |
| `src/assets/catalog/prelude60/prelude60-48221-mullion-clean.png` | Cleaned catalogue raster | `482.21` | Connected isolated mullion contour is preserved for visual reference. | Cleanup is not an assembly drawing and does not establish dimensions beyond the catalogue source. | `SUPPORTING_PROFILE_EVIDENCE` |
| `src/assets/catalog/prelude60/prelude60-48221-mullion-assembly.png` | Cleaned presentation raster | `482.21` | A presentation view of the isolated mullion section is available. | It contains no exact `482.20` mating profile or documented joint dimensions. | `INSUFFICIENT_FOR_GEOMETRY` |
| `src/data/profileSystems/prelude60.ts` | Catalogue-derived data | `482.20`, `482.21` | Records profile identities, roles, raw callouts, and page-2 provenance. | Raw callouts are not contact, overlap, rebate, cut, or machining semantics. | `SUPPORTING_PROFILE_EVIDENCE` |
| `.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv` | Imported database CSV | `482.20`, `482.21` | Records KMG identity/role and database envelope fields; both rows have no CAD filename. | Does not provide a section contour, exact contact, or assembly geometry. | `DATABASE_RELATIONSHIP_EVIDENCE` |
| `.ai/skills/profile-recognition/data/MASTER_PROFILES_ENRICHED.csv` | Imported database CSV | `482.20`, `482.21` | Repeats the imported profile identity and envelope fields. | Same absence of physical pair geometry; no CAD artifact is present in the repository. | `DATABASE_RELATIONSHIP_EVIDENCE` |
| `.ai/skills/joint-knowledge/data/STANDARD_JOINT_RULE_TOKENS.csv` | Legacy database-operation CSV | Context only; divider `482.21` | `BeamHorizontalKMG4k` and `BeamVerticalKMG4k` preserve `SglobkaDelitel`, relation tokens, operation `19`, `POS[]`, and `MM1/MM4`. | These tokens do not prove a contact line/point, overlap, rebate, notch, cut angle/length, or machine path, and do not bind the operation directly to article `482.20`. | `DATABASE_RELATIONSHIP_EVIDENCE` |
| `.ai/skills/joint-knowledge/RELATION_TOKEN_RULES.md` | Evidence protocol | Context only; divider `482.21` | Explicitly defines the KMG operation rows as relationship evidence only. | It is not a physical drawing. | `INSUFFICIENT_FOR_GEOMETRY` |
| `src/data/profileSystems/geometryEvidence.ts` | Runtime evidence read model | `482.20`, `482.21` | Preserves isolated catalogue section facts and keeps pair geometry fields `UNKNOWN`. | Runtime evidence is not source evidence and cannot promote missing facts. | `INSUFFICIENT_FOR_GEOMETRY` |
| `src/data/profileSystems/jointRelationshipEvidence.ts` | Runtime relationship read model | `482.20`, `482.21` | Reports horizontal/vertical relationship context while keeping geometry and direct article-pair binding unknown. | No physical geometry. | `DATABASE_RELATIONSHIP_EVIDENCE` |
| `src/assets/catalog/prelude60/prelude60-48230-48205-true-section01.png` | Catalogue-derived related section image | `482.30`, `482.05` | Shows a different assembled section context. | It is not the requested `482.20` ↔ `482.21` pair and cannot be reused as proof. | `INSUFFICIENT_FOR_GEOMETRY` |
| `src/assets/catalog/prelude60/prelude60-window-reference-node.png` | Related technical raster | Not conclusively mapped to the requested pair | Shows a broader window-node presentation with dimensions. | It has no exact documented `482.20`/`482.21` article binding in the repository. | `INSUFFICIENT_FOR_GEOMETRY` |
| `src/data/profileSystems/prelude60DoorEvidence.ts` | Legacy catalogue/database evidence model | `482.20`; no `482.21` joint row | References `PVC Prelude_bg.pdf / KMG PVC Profiles Systems` and captures page-2 `482.20` callouts. | It is door evidence, not a frame↔mullion assembly source; no physical joint geometry is present. | `INSUFFICIENT_FOR_GEOMETRY` |

## Field source-gap status

| Field | Status | Evidence basis |
|---|---|---|
| PROFILE A SECTION | FOUND | Isolated page-2 catalogue section for `482.20`; supporting only. |
| PROFILE B SECTION | FOUND | Isolated page-2 catalogue section for `482.21`; supporting only. |
| CONTACT LINE | MISSING | No exact-pair sectional drawing or dimensioned contact annotation. |
| CONTACT POINT | MISSING | No exact-pair point/reference location. |
| OVERLAP | MISSING | Envelope/profileW/profileZ differences and tokens are insufficient. |
| REBATE | MISSING | No direct rebate/inset annotation. |
| NOTCH CONTOUR | MISSING | No exact-pair contour or machining drawing. |
| CUT ANGLE | MISSING | `cuttingang` and operation code are not physical joint proof. |
| CUT LENGTH | MISSING | `POS[]` and operation rows do not encode a proven cut length. |
| MACHINING GEOMETRY | MISSING | No CAD, machining sheet, cutter path, or coordinates. |
| ASSEMBLY CROSS-SECTION | PARTIAL | Related sectional visuals exist, but none is directly bound to `482.20` ↔ `482.21`. |

## Legacy source references and source gaps

- The imported profile rows reference no CAD filename for either `482.20` or
  `482.21`; the repository contains no matching DXF/DWG/PDF artifact.
- `src/data/profileSystems/prelude60DoorEvidence.ts` names the source
  `PVC Prelude_bg.pdf / KMG PVC Profiles Systems`, page 2, for catalogue facts.
  The original PDF is not present; the repository has a rasterized page-2
  image instead. This is a source gap for original-document inspection, not
  evidence of an assembly drawing.
- The legacy operation source is identified as an imported database export in
  `.ai/skills/joint-knowledge/SKILL.md`; its source archive is not present in
  this repository. The copied CSV rows remain database relationship evidence
  only.
- No repository reference points to an exact `482.20` ↔ `482.21` CAD file,
  workshop drawing, machining sheet, or manufacturer assembly detail.

## Required next source

The next resolving source must be an original KMG PRELUDE 60 sectional or
assembly detail that explicitly labels both `482.20` and `482.21`, preferably
with contact/reference dimensions and any machining contour. If the joint is
made by a separate operation, the corresponding manufacturer machining sheet
or CAD/DXF section for those two article IDs is required. Until that source is
available and reviewed, all pair geometry remains `UNKNOWN` and the safety
boundaries remain unchanged.

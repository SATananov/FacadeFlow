# GEOMETRY EVIDENCE ACQUISITION 03 — KMG FRAME↔MULLION ASSEMBLY DETAIL SEARCH

Scope: KMG PRELUDE 60 `482.20` Frame / `482.21` Mullion, exact
`FRAME_TO_MULLION` assembly evidence. This report records source-search
results only. It does not generate, reconstruct, or promote geometry.

## Search result

No direct `482.20` ↔ `482.21` assembly drawing, manufacturer cross-section,
machining sheet, CAD/DXF/DWG pair, or documented connector placement was found
in the searched local sources or repository assets.

The authoritative recovered catalogue remains:

- File: `C:\Users\stana\Desktop\Nadejda\PVC Prelude_bg.pdf`
- SHA-256: `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`
- Page 2: isolated `482.20` and `482.21` profile sections.
- Page 3: reinforcement/accessory listings, including `KM242`.

Those pages do not show the requested profiles assembled together.

## Relevant source classification

| Source path | Source type | Profile IDs / tokens | What it directly proves | What it does not prove | Classification |
| --- | --- | --- | --- | --- | --- |
| `C:\Users\stana\Desktop\Nadejda\PVC Prelude_bg.pdf`, page 2 | Manufacturer catalogue PDF | `482.20`, `482.21` | The two isolated profile sections and their printed catalogue callouts | No assembled contact, seating, overlap, rebate, notch, cut, machining, or pair-specific cross-section | `SUPPORTING_PROFILE_EVIDENCE` |
| `C:\Users\stana\Desktop\Nadejda\PVC Prelude_bg.pdf`, page 3 | Manufacturer catalogue PDF | `482.21`, `KM242` | `KM242` is listed as an accessory associated with the mullion family | No KM242 drawing, location, fastener interface, or `482.20` connection detail | `SUPPORTING_CONNECTOR_EVIDENCE` |
| `src/assets/catalog/prelude60/prelude60-catalog-page2.png` | Repository raster of catalogue page 2 | `482.20`, `482.21` | Visible isolated catalogue sections and labels | No assembled pair | `SUPPORTING_PROFILE_EVIDENCE` |
| `src/assets/catalog/prelude60/482-30-frame-page2.png` | Extracted catalogue raster, page 2 | `482.30` | Isolated 482.30 frame section | Not 482.20 and not an assembly | `INSUFFICIENT_FOR_GEOMETRY` |
| `src/assets/catalog/prelude60/482-21-mullion-page2.png` | Extracted catalogue raster, page 2 | `482.21` | Isolated 482.21 mullion section | No frame mate or joint | `SUPPORTING_PROFILE_EVIDENCE` |
| `src/assets/catalog/prelude60/prelude60-48221-mullion-assembly.png` | Cleaned presentation raster | `482.21` | An isolated presentation rendering of the mullion | No 482.20 mate or documented joint | `INSUFFICIENT_FOR_GEOMETRY` |
| `src/assets/catalog/prelude60/prelude60-48230-48205-true-section01.png` | Repository sectional raster | `482.30`, `482.05` | A different assembled section context | It is not the requested 482.20 ↔ 482.21 pair | `INSUFFICIENT_FOR_GEOMETRY` |
| `src/assets/catalog/prelude60/prelude60-window-reference-node.png` | Repository related sectional raster | Related PRELUDE node; exact target article labels are absent | A related window-node presentation contains sectional profile shapes | It does not directly bind the visible shapes to 482.20 and 482.21 or document their joint | `INSUFFICIENT_FOR_GEOMETRY` |
| `.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv` | Imported database CSV | `482.20`, `482.21` | Database identity, role, and envelope fields | No section contour, contact surfaces, or assembly geometry | `DATABASE_RELATIONSHIP_EVIDENCE` |
| `.ai/skills/profile-recognition/data/MASTER_PROFILES_ENRICHED.csv` | Imported database CSV | `482.20`, `482.21`, `KM242` | Repeated profile/accessory identity rows; `KM242` is named as a 4K mullion assembly accessory | No drawing, placement, dimensions, or physical joint | `DATABASE_RELATIONSHIP_EVIDENCE` |
| `.ai/skills/joint-knowledge/data/STANDARD_JOINT_RULE_TOKENS.csv` | Imported operation CSV | `BeamHorizontalKMG4k`, `BeamVerticalKMG4k`, `SglobkaDelitel`, operation `19`, `POS[]`, `MM1`, `MM4` | Preserves relationship/operation tokens | No physical contour, cut, depth, placement, or article-pair proof | `DATABASE_RELATIONSHIP_EVIDENCE` |
| `C:\Users\stana\Desktop\KMG_Geometry_Evidence_Search_01.zip`, `KMG_GEOMETRY_EVIDENCE_HITS.csv` | Archived extracted-evidence CSV | `482.20`, `482.21`, KMG operation rows | Shows the prior database search results; it includes unrelated `.dxf` rows, but no CAD filename on the 482.20/482.21 item rows | The archive is not a drawing and its references do not supply missing CAD contents | `SOURCE_REFERENCE_ONLY` |
| `C:\Users\stana\Desktop\KMG_Joint_Extract_01.zip`, `KMG_items_with_operations.csv` | Archived database export | `482.20`, `482.21`, `KM242` | Repeats item names, database dimensions, and KM242’s database label | No physical connector drawing or assembly | `DATABASE_RELATIONSHIP_EVIDENCE` |

The related PRELUDE sectional material documented in the repository concerns
`482.21` with `482.18`/`482.15`, or `482.30` with `482.05`; it is not direct
evidence for `482.20` ↔ `482.21` and has not been reused as such.

## Legacy source gaps

- The legacy item evidence contains `.dxf` references for other item IDs, but
  the `482.20` and `482.21` item rows have no associated CAD filename.
- The searched extracted legacy folders contain MDB/XLT/help/PDF material but
  no matching 482.20/482.21 CAD, drawing, help page, or assembly image.
- `SglobkaDelitel`, `BeamHorizontalKMG4k`, and `BeamVerticalKMG4k` have
  operation-token rows, but no local macro, tool definition, operation
  drawing, or documented machining template was found.
- `KM242` has catalogue/database identity evidence only. No source shows its
  physical shape, exact seat, fastener position, or placement between these
  two profiles.

## Exact target field status

| Field | Status | Reason |
| --- | --- | --- |
| `482.20` ↔ `482.21` assembly drawing | `MISSING` | No direct pair drawing found |
| Frame↔mullion cross-section | `PARTIAL` | Related sectional visuals exist, but none is article-pair bound |
| KM242 drawing | `MISSING` | Only catalogue/database references exist |
| KM242 placement | `MISSING` | No direct placement detail exists |
| Contact surfaces | `MISSING` | Not documented for the exact pair |
| Contact depth | `MISSING` | Not documented for the exact pair |
| Overlap | `MISSING` | Not derived from envelopes or related sections |
| Rebate | `MISSING` | Operation/rule tokens are not physical proof |
| Mullion end notch | `MISSING` | No notch drawing or machining contour |
| Machining dimensions | `MISSING` | No article-pair machining sheet |
| Cut angle | `MISSING` | No direct cut-angle source |
| Cut length | `MISSING` | No direct cut-length source |
| Operation documentation | `PARTIAL` | Relationship tokens exist; physical operation documentation does not |

All exact-pair physical geometry fields remain `UNKNOWN` in the geometry
evidence model. No source in this search changes the automatic-geometry,
automatic-profile-selection, or automatic-joint-creation boundaries.

## Recommended next source

Obtain the original KMG/PRELUDE technical assembly sheet or manufacturer CAD
package that explicitly labels both `482.20` and `482.21`, preferably with the
KM242 connector shown in section and the corresponding machining detail. A
workshop drawing or original legacy help/PDF attachment for the 4K divider
operation would resolve the remaining operation-documentation gap only if it
also shows the physical article pair.

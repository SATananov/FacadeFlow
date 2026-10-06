# KMG 482.21 ↔ 482.18 Mullion-to-Sash Evidence Acquisition 01

## Result

No physical-display-ready joint was established. The authoritative PRELUDE 60
catalogue provides a source-bound page-25 sectional context containing
`482.21` Mullion, `482.18` Sash, `482.15` bead, and 24 mm glazing. It does
not provide enough directly documented interface facts to promote physical
geometry.

This report is evidence acquisition and classification only. No geometry,
fact model, physical gate, profile selection, or runtime behavior was changed.

## Sources reviewed

### Primary local source

- **Path:** `C:\Users\stana\Desktop\Nadejda\PVC Prelude_bg.pdf`
- **SHA-256:** `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`
- **Relevant location:** printed page 25 and its corresponding PDF-viewer page;
  adjacent catalogue context was reviewed for identifiers and system context.
- **Classification:** `PARTIAL_ASSEMBLY_EVIDENCE` with supporting
  `PRIMARY_MANUFACTURER_PROFILE_EVIDENCE`.
- **Directly established:** page-25 sectional context names `482.21`, `482.18`,
  `482.15`, and 24 mm glazing together. The repository records this as the
  strongest clean exact-pair candidate.
- **Not established:** exact mullion/sash contact, seating, clearance,
  overlap, rebate, gasket compression, closing seal relationship, machining,
  or cut data.

### Official public source

- [Official Altest PRELUDE technical PDF](https://altestgroup.com/pdf/system/40/bg.pdf)
  — `PRIMARY_MANUFACTURER_ASSEMBLY_EVIDENCE` at the catalogue-context level;
  the page-25 source locator is the canonical public reference for the local
  page-25 evidence. The PDF was not downloaded again in this task, so no
  separate external hash is claimed.
- [Official Altest KMG profile catalogue](https://altestgroup.com/pdf/system/39/en.pdf)
  — `PRIMARY_MANUFACTURER_PROFILE_EVIDENCE`; supports the isolated identity
  and role records for the PRELUDE profile family, but does not close the
  mullion-to-sash interface.

### Other public/local sources

- `https://visionplast.com/wp-content/uploads/2019/07/pvc_kmg.pdf` and
  `https://carega.ro/files/KMG-pliant.pdf` — distributor/mirror catalogue
  copies, classified `OFFICIAL_DISTRIBUTOR_TECHNICAL_EVIDENCE` or
  `INSUFFICIENT_FOR_GEOMETRY`; they repeat profile listings and catalogue
  context but add no exact 482.21 ↔ 482.18 assembly detail.
- Local Altest extraction, current package-audit material, extracted legacy
  folders, repository reports, and catalogue assets — searched for both
  identifiers and assembly/CAD/fabrication terms. No independent dimensioned
  assembly drawing, fabrication sheet, or CAD/DXF/DWG pair was found.
- Existing presentation assets and templates are not source evidence. Their
  offsets/visible overlaps remain explicitly non-production presentation data.

## Profile verification

- `482.21`: catalogue identity verified as PRELUDE 60 Mullion / Делител; the
  isolated profile record is from the authoritative catalogue source.
- `482.18`: catalogue identity verified as PRELUDE 60 Sash / Крило; it is a
  distinct sash profile record and no facts from `482.05` were transferred.
- The page-25 source context binds the two identifiers in the same sectional
  presentation. This is pair/context evidence, not a complete physical joint
  contract.

## Physical fact matrix

| Fact | Status | Evidence boundary |
|---|---|---|
| Profile A identity — 482.21 | VERIFIED | Catalogue/profile provenance identifies the mullion. |
| Profile B identity — 482.18 | VERIFIED | Catalogue/profile provenance identifies the sash. |
| Role A — Mullion | VERIFIED | Catalogue role and repository profile record. |
| Role B — Sash | VERIFIED | Catalogue role and repository profile record. |
| Pair binding | VERIFIED | Both identifiers occur in the page-25 PRELUDE 60 sectional context. |
| Assembly cross-section | PARTIAL | A manufacturer sectional context exists, but the interface is not sufficiently documented for physical promotion. |
| Mullion contact surface | UNKNOWN | No directly documented contact contour or surface definition accepted. |
| Sash contact surface | UNKNOWN | No directly documented contact contour or surface definition accepted. |
| Seating relationship | UNKNOWN | Relative placement does not establish seating or closing mechanics. |
| Contact depth | UNKNOWN | No accepted depth/clearance fact for the joint interface. |
| Overlap | UNKNOWN | Presentation overlap values are not production evidence. |
| Rebate | UNKNOWN | No accepted rebate/falz fact. |
| Gasket / seal placement | UNKNOWN | The presence of glazing/gasket context does not prove exact mullion/sash seal placement or compression. |
| Relative position | PARTIAL | The page-25 section gives contextual relative placement; the production mate is not approved. |
| Closing relationship | UNKNOWN | No direct closing, weather-seal, or sash-clearance instruction found. |
| End treatment | UNKNOWN | No relevant end-treatment detail was documented for this interface. |
| Cut relationship | UNKNOWN | No cut angle, cut length, or fabrication relationship found. |

`VERIFIED` is limited to the stated identity, role, and source-bound context.
It does not mean that the physical interface is verified.

## Physical display and gate decision

- **Primary manufacturer physical evidence found:** YES, partial only.
- **Primary CAD/DXF/DWG evidence found:** NO.
- **Physical display geometry ready:** NO.
- **Machine geometry ready:** NO.
- **Current physical gate:** `UNKNOWN` / not changed; the existing gate is
  scoped to the explicit frozen `FRAME_TO_MULLION` case and was not broadened
  here.
- **Would current evidence support promotion:** NO.
- **Potential promotion:** NO.

The unresolved contact and seating facts are sufficient to block physical
display promotion even though machining evidence is not required for a static
display. The existing page-25 presentation values remain operator-sketch
values only and cannot supply those missing facts.

## Exact missing evidence

Promotion would require an original manufacturer assembly/fabrication detail,
or manufacturer CAD/DXF/DWG section, that explicitly binds `482.21` and
`482.18` and documents:

1. mullion and sash contact surfaces;
2. seating/closing relationship and contact depth or clearance;
3. any physical overlap/rebate required by the section;
4. gasket/seal placement if it forms part of the intended display;
5. any relevant end treatment or cut relationship.

A catalogue page that merely lists the profiles, database relationship tokens,
or existing FacadeFlow presentation geometry would not satisfy this gap.

## Safety conclusion

The `482.20` Frame ↔ `482.21` Mullion freeze remains unaffected and respected.
No production code was changed. No geometry was generated, no profile was
selected automatically, no joint was created, and no machine-ready status was
introduced.

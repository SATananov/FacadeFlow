# KMG 482.05 ↔ 482.15 Sash-to-Bead Evidence Acquisition 01

## Result

No physical-display-ready joint was established. The source provides a
source-bound 482.05 sash / 482.15 bead / 24 mm glazing section context, but
the exact seating and retention interface is not documented sufficiently for
physical geometry promotion. Machine geometry remains unavailable.

This report is evidence classification only. It does not modify the geometry
fact model, physical geometry gate, runtime geometry, or automatic behavior.

## Sources reviewed

### Primary local source

- **Path:** `C:\Users\stana\Desktop\Nadejda\PVC Prelude_bg.pdf`
- **SHA-256:** `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`
- **Relevant location:** printed page 23, PDF-viewer page 24; adjacent catalogue
  context reviewed as needed.
- **Classification:** `PARTIAL_ASSEMBLY_EVIDENCE` / `PRIMARY_MANUFACTURER_GLAZING_EVIDENCE`.
- **Directly visible/documented context:** the page-23 sectional drawing context
  names `482.05`, `482.15`, and `24 mm`; the repository evidence record also
  identifies the surrounding `482.30` frame context. The source is labelled as
  sectional drawings at scale 1:1.
- **Not directly established:** an accepted, dimensionally interpreted bead
  seat, retention contour, gasket location, or production-rule interface.

The page-23 callouts are retained as source callouts only. They are not
reinterpreted as contact depth, overlap, rebate, or other joint facts.

### Official public source references

- [Official Altest KMG profile catalogue](https://altestgroup.com/pdf/system/39/en.pdf)
  — `PRIMARY_MANUFACTURER_PROFILE_EVIDENCE`; identifies 482.05 as sash and
  482.15 as a 24 mm glass bead in an isolated profile catalogue context. It
  does not prove their assembled interface.
- [Official Altest PRELUDE technical PDF](https://altestgroup.com/pdf/system/40/bg.pdf)
  — `PRIMARY_MANUFACTURER_GLAZING_EVIDENCE`; page 23 / PDF viewer page 24 is
  the source-bound sectional context for `482.05`, `482.15`, and `24 mm`.
  The public source was used for provenance and locator confirmation; the
  authoritative local copy and its exact hash remain the primary local
  artefact for this report.
- Public distributor/mirror copies reviewed during the source search —
  `OFFICIAL_DISTRIBUTOR_TECHNICAL_EVIDENCE` where provenance is explicit, but
  no stronger exact sash-to-bead interface was found:
  `https://visionplast.com/wp-content/uploads/2019/07/pvc_kmg.pdf` and
  `https://carega.ro/files/KMG-pliant.pdf`.
- Secondary catalogue index material, including the public Scribd result for
  the older KMG catalogue, was `INSUFFICIENT_FOR_GEOMETRY`; it repeats profile
  and bead identifiers but does not close the physical interface.

### Local supplementary search

The local Altest extraction, current package-audit material, extracted legacy
folders, repository evidence, and available image assets were searched for
`482.05`, `482.15`, bead/glazing terms, 24 mm, gasket, seat, groove, snap,
and retention references. No independent dimensioned sash-to-bead fabrication
detail, CAD/DXF/DWG, or installation sheet was found.

The local `ETK_Par.txt` hit contains only generic `FRAMETYPE` and `GASKET`
fields. It is `INSUFFICIENT_FOR_GEOMETRY` and does not bind either target
profile or describe bead placement.

## 24 mm glazing context

The page-23 source context explicitly associates `482.15` with `24 mm` and
shows `482.05` in the same sectional context. This supports the following
limited statement:

- 24 mm glass association: source-bound catalogue context is present.
- The drawing context includes a glazing section/seat region, but the exact
  physical seat dimensions and gasket positions were not accepted as joint
  facts.
- The source does not authorize glass cut dimensions, inset values, automatic
  bead selection, or production geometry.

## Physical fact matrix

| Fact | Status | Evidence boundary |
|---|---|---|
| Profile A identity — 482.05 | VERIFIED | Catalogue/profile provenance identifies 482.05 as sash. |
| Profile B identity — 482.15 | VERIFIED | Catalogue/profile provenance identifies 482.15 as 24 mm glass bead. |
| Pair binding | VERIFIED | Both identifiers occur in the same page-23 source-bound 24 mm sectional context; compatibility is not promoted as a rule. |
| Assembly cross-section | PARTIAL | A manufacturer sectional context exists, but its physical interface has not been sufficiently interpreted for promotion. |
| Bead seating | UNKNOWN | No directly documented seat/retention interpretation accepted. |
| Bead contact surface | PARTIAL | The section context places the bead at the sash/glazing interface; exact contact surfaces remain unverified. |
| Sash contact surface | PARTIAL | The section context binds the sash side of the interface; exact contact surfaces remain unverified. |
| Insertion / retention relationship | UNKNOWN | No explicit installation, snap, clip, or retention instruction found. |
| Overlap | UNKNOWN | No accepted physical overlap value or unambiguous contour interpretation. |
| Rebate / groove | UNKNOWN | No accepted rebate/groove fact. |
| Glazing seat | UNKNOWN | A glazing context is visible, but exact seat geometry is not established. |
| 24 mm glass association | VERIFIED | Page-23 source context explicitly includes `24 mm` with 482.05 and 482.15. |
| Gasket placement | UNKNOWN | Generic gasket references and profile context do not prove exact placement in this pair. |
| Relative position | PARTIAL | The source section supplies relative sectional context, but not an approved production placement model. |
| Cut / end relationship | UNKNOWN | No bead cut/end detail was directly documented. |

`VERIFIED` here means only the stated source-bound fact. It does not mean that
the physical joint is ready for generation.

## Readiness decision

- **Primary manufacturer physical evidence found:** YES, partial only.
- **Physical display geometry ready:** NO.
- **Machine geometry ready:** NO.
- **Current physical gate:** `UNKNOWN` / not changed by this acquisition task;
  the existing gate is not broadened to this `SASH_TO_BEAD` context.
- **Potential promotion:** NO.

The interface facts that would be required for a safe physical display remain
unresolved. The existing candidate records remain unreviewed and retain
`rulePromotionAllowed: false`, `automaticGeometryAllowed: false`, and
`machineReady: false`.

## Exact missing evidence

The next source must directly bind `482.05` and `482.15` and document enough
of the actual interface to remove ambiguity about:

1. bead seating and retention/insertion relationship;
2. sash and bead contact surfaces;
3. rebate/groove and any physically meaningful overlap;
4. glazing seat and gasket placement, if part of the intended display;
5. any cut/end relationship needed by the intended static geometry.

The preferred source is an original manufacturer dimensioned glazing detail,
bead installation/fabrication sheet, or manufacturer CAD/DXF/DWG section with
the article identifiers visible. A generic profile page, database row, or
visual similarity is insufficient.

## Safety conclusion

No production code was changed. No geometry was generated. No profile was
selected automatically. No joint or machining operation was created. The
482.20 ↔ 482.21 freeze remains unaffected.

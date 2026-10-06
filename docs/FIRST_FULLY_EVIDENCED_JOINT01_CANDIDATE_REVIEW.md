# First Fully-Evidenced Joint 01 — Candidate Review

## Result

**NO FULLY-EVIDENCED JOINT FOUND.**

The frozen KMG pair `482.20` Frame ↔ `482.21` Mullion remains blocked. No reviewed source currently supplies all physical facts required to implement a first production-like physical joint display. Existing FacadeFlow drawings and presentation templates were not treated as evidence.

## Evidence standard

A candidate would need direct, provenance-bound evidence for the exact participant pair and relationship context, including the physical contact/seating relationship and every fact needed by the intended display. A catalogue section that merely shows components together is not automatically a machining rule or a measured mate. Database relationship rows, operation names, envelope dimensions, arithmetic differences, and existing implementation are insufficient.

The recovered authoritative source used by the current PRELUDE records is `PVC Prelude_bg.pdf`, SHA-256 `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`. Page 2 proves isolated profiles; pages 23 and 25 are documented sectional catalogue references for the candidates below.

## Candidate matrix

`PARTIAL` means the source gives some direct contextual evidence but does not close the physical fact. `UNKNOWN` means the repository has no direct fact sufficient for that field. `NOT_REQUIRED` is not used because the candidate relationships still require a physical interface definition for a physical display.

| Rank | System | Profile A / role | Profile B / role | Context | Pair binding | Assembly cross-section | Contact surfaces | Contact depth | Overlap | Rebate | Notch / end treatment | Cut relationship | Connector placement | Machining data | Source provenance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | KMG PRELUDE 60 | 482.30 / Frame | 482.05 / Sash | FRAME_TO_SASH | VERIFIED | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | NOT_REQUIRED | UNKNOWN | VERIFIED |
| 2 | KMG PRELUDE 60 | 482.21 / Mullion | 482.18 / Sash | MULLION_TO_SASH | VERIFIED | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | NOT_REQUIRED | UNKNOWN | VERIFIED |
| 3 | KMG PRELUDE 60 | 482.05 / Sash | 482.15 / Glass bead | SASH_TO_BEAD | VERIFIED | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | NOT_REQUIRED | UNKNOWN | VERIFIED |
| 4 | KMG PRELUDE 60 | 482.05 / Sash | 24 mm glass | SASH_TO_GLASS | VERIFIED | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | NOT_REQUIRED | NOT_REQUIRED | UNKNOWN | NOT_REQUIRED | UNKNOWN | VERIFIED |
| 5 | KMG PRELUDE 60 | 482.20 / Frame | 482.21 / Mullion | FRAME_TO_MULLION | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | VERIFIED for isolated profile/relationship sources only |

### Rank 1 — closest candidate: 482.30 Frame ↔ 482.05 Sash

Source: `PVC Prelude_bg.pdf`, page 23, documented as a sectional drawing containing `482.30 + 482.05 + 482.15` with 24 mm glazing. The source directly binds the two profile identities in one catalogue section and supports a visible sectional relationship.

It does **not** directly establish exact contact surfaces, seating depth, manufacturing overlap, rebate/inset, cut relationship, or machining geometry. The repository explicitly records `assemblyEvidenceStatus: sectional-drawing-uninterpreted`, `sashOverlapMm: null`, `sashInsetMm: null`, and `glazingInsetMm: null`. The related presentation values are operator-sketch values and are not production mate geometry.

Physical display geometry ready: **NO**.

Current physical gate: **UNKNOWN / not applicable to this FRAME_TO_SASH context**; the current gate contract is focused on explicit `FRAME_TO_MULLION` context and was not changed for this review.

Potential promotion: **NO**. A future promotion would require a directly interpreted assembly drawing or equivalent source defining the physical interface, not merely the visible section.

### Rank 2 — 482.21 Mullion ↔ 482.18 Sash

Source: `PVC Prelude_bg.pdf`, page 25, documented as a sectional drawing containing `482.21 + 482.18 + 482.15` with 24 mm glazing. The exact pair is source-bound and the visible sectional context is stronger than the frozen frame↔mullion case.

It does **not** prove exact contact/seating, manufacturing overlap, rebate, cut relationship, or machining. The repository explicitly states that the page-25 values are for operator presentation and that overlap/inset/glass-cut values remain unknown.

Physical display geometry ready: **NO**.

Potential promotion: **NO**.

### Rank 3 — Sash ↔ bead/glass references

The page-23 and page-25 sections source-bind `482.15` to 24 mm glazing in the respective sectional context. They support catalogue identity and nominal glazing context, but the repository separately records bead-to-base compatibility, bead placement, glazing seat, inset, and glass-cut dimensions as unresolved.

These are useful supporting evidence, not fully evidenced physical joints.

## Rejected or insufficient candidates

- `482.20 Frame ↔ 482.21 Mullion`: rejected as the first candidate because the geometry freeze remains active. Only isolated profile sections and database relationship evidence exist; contact, overlap, rebate, notch, cut, connector placement, and assembly cross-section remain UNKNOWN.
- `482.21 Mullion ↔ 482.05 Sash`: not promoted because the current page-25 source binds `482.18`, not `482.05`; the repository explicitly records this as an unconfirmed pair.
- `482.30 ↔ 482.05` presentation template: not independent source evidence. Its offsets and visible overlap are explicitly operator-sketch values, not production geometry.
- `482.21 ↔ 482.18` presentation template: same limitation; its visible overlap and offset are not manufacturing facts.
- Related profiles or other-system records: no inspected source provided an exact, direct, complete physical assembly contract suitable for this first joint.

## Exact missing evidence for the closest candidate

For `482.30 ↔ 482.05`, the next source must directly document:

- actual profile contact/seating surfaces and depth;
- whether and how overlap or rebate is defined;
- any sash end treatment/notch and cut relationship required by the section;
- an unambiguous physical assembly cross-section tied to both article IDs;
- machining data only if machine geometry is later considered.

An original manufacturer fabrication/assembly detail, dimensioned technical cross-section, or manufacturer CAD/DXF/DWG assembly would be sufficient source types. A source that only repeats catalogue profiles, database operation names, or presentation offsets would not be sufficient.

## Safety conclusion

The first safe physical joint has **not** been found. Physical display geometry remains blocked for the reviewed candidates, machining remains blocked, and no production code or gate semantics were changed.

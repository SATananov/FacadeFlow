# Evidence Candidate Ranking 02

## Result

**NO PHYSICAL-DISPLAY-READY JOINT FOUND.**

All currently known candidates retain at least one unresolved physical fact. The ranking below compares source evidence only; existing FacadeFlow drawings, presentation offsets, runtime geometry, and database operation semantics do not add score.

## Ranking method

Each candidate is evaluated against the same fact categories. Status credit is:

- `VERIFIED`: full credit;
- `PARTIAL`: half credit;
- `UNKNOWN`: zero credit;
- `CONFLICTED`: negative blocker credit;
- `NOT_REQUIRED`: neutral only when the relationship genuinely has no such physical requirement.

The weighting is:

- profile identity, roles, and exact pair binding: 3 points each;
- physical assembly/contact facts: 4 points each;
- source provenance: 3 points for primary manufacturer assembly/CAD, 2 for supporting manufacturer catalogue, 1 for distributor/secondary material;
- unresolved identifier ambiguity: −3 points;
- any `CONFLICTED` physical fact: −4 points.

Pair binding is weighted more heavily than generic relationship tokens. Machining evidence is reported separately and does not by itself disqualify a candidate from physical display, but no candidate receives machine-ready status without direct machining evidence.

## Ranked candidates

| Rank | Candidate | Context | Verified | Partial | Unknown | Conflicted | Ambiguity | Evidence score | Physical display | Machine geometry | Main blocker |
|---|---|---|---:|---:|---:|---:|---|---:|---|---|---|
| 1 | 482.21 Mullion ↔ 482.18 Sash | MULLION_TO_SASH | 6 | 2 | 9 | 0 | No | 25 | NO | NO | Contact/seating/overlap/rebate remain unresolved. |
| 2 | 482.30 Frame ↔ 482.05 Sash | FRAME_TO_SASH | 6 | 2 | 9 | 0 | Yes | 22 | NO | NO | Contact/seating/overlap/rebate remain unresolved; 482.30-K mapping ambiguous. |
| 3 | 482.05 Sash ↔ 482.15 Bead | SASH_TO_BEAD | 5 | 3 | 9 | 0 | No | 20 | NO | NO | Bead-base compatibility and exact seat/placement remain unreviewed. |
| 4 | 482.15 Bead ↔ 24 mm Glass | BEAD_TO_GLASS | 4 | 3 | 8 | 0 | No | 16 | NO | NO | Glass seat, inset, and placement remain unknown. |
| 5 | 482.05 Sash ↔ 24 mm Glass | SASH_TO_GLASS | 4 | 2 | 9 | 0 | No | 13 | NO | NO | Glass seat, inset, cut, and sash interface remain unknown. |
| 6 | 482.20 Frame ↔ 482.21 Mullion | FRAME_TO_MULLION | 6 | 0 | 12 | 0 | No | 10 | NO / BLOCKED | NO | Frozen exact-joint boundary; no direct pair assembly evidence. |

The score is comparative, not a readiness threshold. `Rank 3` has strong pair identity and source context, but its unresolved physical interface remains larger than the rank suggests. The exact candidate records and source notes remain authoritative for the individual facts.

## Standard fact matrix

| Candidate | Profile A identity | Profile B identity | Role A | Role B | Pair binding | Assembly cross-section | Contact surfaces | Seating relationship | Contact depth | Overlap | Rebate | Gasket / seal placement | Relative position | Notch / end treatment | Cut relationship | Connector placement | Machining geometry | Source provenance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 482.30 ↔ 482.05 | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | UNKNOWN | UNKNOWN | NOT_REQUIRED | UNKNOWN | VERIFIED |
| 482.05 ↔ 482.15 | VERIFIED | VERIFIED | VERIFIED | VERIFIED | PARTIAL | PARTIAL | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | NOT_REQUIRED | UNKNOWN | NOT_REQUIRED | UNKNOWN | VERIFIED |
| 482.21 ↔ 482.18 | VERIFIED | VERIFIED | VERIFIED | VERIFIED | VERIFIED | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL | UNKNOWN | UNKNOWN | NOT_REQUIRED | UNKNOWN | VERIFIED |
| 482.15 ↔ 24 mm glass | VERIFIED | VERIFIED | VERIFIED | VERIFIED | PARTIAL | PARTIAL | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | NOT_REQUIRED | UNKNOWN | PARTIAL | NOT_REQUIRED | NOT_REQUIRED | UNKNOWN | UNKNOWN | VERIFIED |
| 482.05 ↔ 24 mm glass | VERIFIED | VERIFIED | VERIFIED | VERIFIED | PARTIAL | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | NOT_REQUIRED | UNKNOWN | NOT_REQUIRED | UNKNOWN | NOT_REQUIRED | UNKNOWN | UNKNOWN | VERIFIED |
| 482.20 ↔ 482.21 | VERIFIED | VERIFIED | VERIFIED | VERIFIED | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | PARTIAL |

`NOT_REQUIRED` is used only for connector placement where no connector is part of the documented candidate, for gasket placement where the relationship is explicitly glass-free, or for cut/end treatment where the candidate is a section-only display relation and no cut operation is part of the intended display. It is not used to hide an unresolved profile interface.

## Rank 1 — 482.21 Mullion ↔ 482.18 Sash

Strongest clean candidate: ALTEST PRELUDE 60 page 25, which directly names `482.21 + 482.18 + 482.15` with 24 mm glazing in one sectional context. The source-bound pair and roles are clear, with no known identifier ambiguity.

The repository explicitly records that the page-25 visible overlap/offset is operator presentation and that exact contact, seating, overlap, inset, and machining remain unknown. Physical display geometry: **NO**. Machine geometry: **NO**. Current physical gate: **UNKNOWN / not applicable to this MULLION_TO_SASH context**.

## Rank 2 — 482.30 Frame ↔ 482.05 Sash

Strongest source: ALTEST PRELUDE 60 page 23, printed page 23 / PDF viewer page 24, sections 1–2, naming `482.30 + 482.05 + 482.15` in one dimensioned 24 mm sectional context. Local source: `C:\Users\stana\Desktop\Nadejda\PVC Prelude_bg.pdf`, SHA-256 `1BA9174B1CF3974B4DE171B57147DD4FAD41D81958EA62D08B977223C5200F5F`. The public catalogue profile sheet independently identifies 482.30 as frame and 482.05 as sash. [Official Altest KMG profile catalogue](https://altestgroup.com/pdf/system/39/en.pdf)

The exact pair binding is the cleanest current candidate. The section supplies only partial physical assembly evidence. Presentation values such as 15.5 mm offset, 30 mm visible overlap, and reference corrections are explicitly excluded from the score as non-production presentation/reference data.

Current physical gate: **UNKNOWN** because the existing gate contract is focused on `FRAME_TO_MULLION`; no gate semantics were changed for this ranking. Physical display geometry: **NO**. Machine geometry: **NO**.

Identifier penalty: `482.30-K` appears in database/reference records while the manufacturer section uses `482.30`; equivalence remains unresolved.

## Rank 3 — 482.05 Sash ↔ 482.15 Bead

The same page-23 source explicitly names the sash, bead, and 24 mm glazing in one section. Repository evidence records separate bead-base compatibility and placement candidates, both still `reviewed: false`, `rulePromotionAllowed: false`, and `automaticGeometryAllowed: false`.

This is the **lowest-effort candidate to unblock** because the source already targets the bead-to-sash placement question. It still needs explicit human/source review of contact, seat, compatibility, and relative placement. Physical display: **NO**. Machine geometry: **NO**.

## Rank 3 — 482.21 Mullion ↔ 482.18 Sash

Page 25 source context directly names the pair with bead and 24 mm glazing. It is source-bound and role-clean, but the repository explicitly says its visible overlap/offset is operator presentation and that exact overlap, inset, seat, and machining remain unknown.

Physical display: **NO**. Machine geometry: **NO**.

## Lower-ranked candidates

- `482.15 ↔ 24 mm glass`: nominal bead/thickness catalogue evidence exists, but glass seat/inset/placement are unresolved.
- `482.05 ↔ 24 mm glass`: the page-23 context is relevant, but no accepted glass seat, inset, or cut relationship exists.
- `482.20 ↔ 482.21`: remains the frozen comparison case. Isolated sections and relationship tokens do not establish the physical joint; its physical gate remains BLOCKED.

## Best evidence candidate and unblock path

Best evidence candidate: **482.21 Mullion ↔ 482.18 Sash** because it has the cleanest exact pair binding and role identity in a manufacturer sectional context without the 482.30-K identifier ambiguity.

Lowest-effort candidate to unblock: **482.05 Sash ↔ 482.15 Bead**, because a source-bound page-23 placement candidate already exists. The required facts are explicit bead-to-sash compatibility, contact/seating surfaces, relative placement, and any rebate/retention contour needed for the intended physical display.

Exact source type needed for rank 1: an original manufacturer dimensioned frame-to-sash assembly detail, fabrication/workshop drawing, or manufacturer CAD/DXF/DWG that explicitly binds `482.30` (or resolves `482.30-K`) and `482.05`. It must document contact/seating, depth/clearance, overlap/rebate, gasket/seal placement where applicable, relative position, and any required end/cut relationship.

## Safety conclusion

No candidate is physically display-ready or machine-ready. The frozen `482.20 ↔ 482.21` boundary remains respected. No production code, evidence model, gate, or runtime geometry was modified.

# Physical Geometry Candidate Freeze 01

## Scope

This document freezes the current evidence state for the reviewed KMG PRELUDE
60 joint candidates. It records a current evidence snapshot, not a permanent
architectural limitation:

**PHYSICAL_DISPLAY_READY_CANDIDATE_COUNT = 0**

**MACHINE_READY_CANDIDATE_COUNT = 0**

No candidate is approved for physical display geometry. Unknown technical facts
remain intentionally unknown. No profile, joint, or machining operation is
created by this freeze.

## Candidates reviewed

| Candidate | Context | Final state | Current evidence summary |
|---|---|---|---|
| 482.21 Mullion ↔ 482.18 Sash | MULLION_TO_SASH | `EVIDENCE_INCOMPLETE` / `NOT_READY_FOR_PHYSICAL_DISPLAY` | Page-25 manufacturer section binds the pair and roles, but contact, seating, clearance, overlap/rebate, gasket/closing, and cut facts remain unresolved. |
| 482.30 / 482.30-K Frame ↔ 482.05 Sash | FRAME_TO_SASH | `IDENTIFIER_AMBIGUITY` / `EVIDENCE_INCOMPLETE` / `NOT_READY_FOR_PHYSICAL_DISPLAY` | Page-23 context is partial; 482.30 versus 482.30-K is unresolved and the physical interface remains incomplete. |
| 482.05 Sash ↔ 482.15 Bead | SASH_TO_BEAD | `EVIDENCE_INCOMPLETE` / `NOT_READY_FOR_PHYSICAL_DISPLAY` | Page-23 context binds sash, bead, and 24 mm glazing, but seating, retention, contact, groove/rebate, gasket, and cut facts remain unresolved. |
| 482.05 Sash ↔ 24 mm Glass | SASH_TO_GLASS | `EVIDENCE_INCOMPLETE` / `NOT_READY_FOR_PHYSICAL_DISPLAY` | Nominal glazing context exists; the physical seat, inset, gasket, glass cut, and interface are not directly established. |
| 482.15 Bead ↔ 24 mm Glass | BEAD_TO_GLASS | `EVIDENCE_INCOMPLETE` / `NOT_READY_FOR_PHYSICAL_DISPLAY` | Nominal bead/thickness evidence exists; glazing seat, inset, retention, and placement remain unresolved. |
| 482.20 Frame ↔ 482.21 Mullion | FRAME_TO_MULLION | `FROZEN_BLOCKED` / `NOT_READY_FOR_PHYSICAL_DISPLAY` | Existing formal freeze remains active. Isolated sections and database relationship tokens do not prove the physical joint. |

The ranking snapshot remains the one documented in
`docs/EVIDENCE_CANDIDATE_RANKING02.md`: 482.21↔482.18 is the best evidence
candidate, while 482.05↔482.15 is the lowest-effort candidate to unblock.
Neither is ready.

## Candidate-specific blockers

### 482.21 Mullion ↔ 482.18 Sash

The page-25 section provides exact pair/context evidence, but not:

- mullion or sash contact surfaces;
- seating, closing relationship, or clearance;
- physical overlap or rebate;
- gasket/seal placement or compression;
- relevant end treatment or cut relationship.

### 482.30 / 482.30-K Frame ↔ 482.05 Sash

The candidate remains subject to the unresolved `482.30` versus `482.30-K`
identifier ambiguity, as well as incomplete contact/seating, overlap/rebate,
gasket/interface, and cut/end evidence.

### 482.05 Sash ↔ 482.15 Bead

The candidate has source-bound 24 mm glazing context, but bead seating,
retention, contact surfaces, groove/rebate, gasket placement, and cut/end
relationship remain unknown.

### 482.20 Frame ↔ 482.21 Mullion

The formal freeze in
`docs/KMG_48220_48221_GEOMETRY_EVIDENCE_FREEZE01.md` remains active. The
physical joint is blocked by unknown contact, depth, overlap, rebate, notch,
cut, connector placement, machining, and assembly-cross-section facts.

No additional blockers are invented here for candidates that were not directly
evaluated; the candidate-specific reports remain the detailed source of record.

## Evidence boundary

Relationship evidence, operation names, database rows, isolated profile
sections, envelope dimensions, presentation offsets, and schematic drawings do
not establish a physical joint. Existing FacadeFlow presentation or runtime
geometry is not source evidence and does not increase a candidate’s readiness.

The current candidate count is therefore an evidence-state assertion, not a
claim that these joints do not exist.

## Promotion / unfreeze conditions

A candidate may leave this freeze only after new direct evidence resolves every
physical fact required for its exact relationship and intended display. An
acceptable source is one of:

- manufacturer dimensioned assembly drawing;
- manufacturer fabrication/workshop manual;
- exact manufacturer CAD/DXF/DWG assembly;
- direct profile-pair technical section;
- documented connector or bead installation detail;
- other direct manufacturer technical interface documentation.

The source must bind the exact profile identities and relationship context. It
must document the physical contact/seating interface, and any overlap, rebate,
clearance, gasket, end-treatment, or cut fact required by the intended
display. A database relationship token or isolated catalogue section alone is
insufficient.

Machining evidence is a separate promotion decision. Even if a physical
display candidate becomes allowed later, machine readiness does not follow
automatically.

## Safety conclusion

UNKNOWN is intentional and correct. The repository currently has no approved
physical-display-ready joint and no machine-ready candidate. Automatic profile
selection, joint creation, physical geometry generation, and machining remain
disabled by the evidence boundary.

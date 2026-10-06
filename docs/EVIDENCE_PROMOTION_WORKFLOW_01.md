# Evidence Promotion Workflow 01

## Purpose

`evidencePromotion.ts` is a read-only evaluation workflow for proposed new
physical-joint evidence. It answers whether a precisely bound candidate has
enough direct evidence to become **eligible for explicit human review**.

It does not write evidence, change the geometry gate, approve a joint, assign
profiles, create joints, generate geometry, or enable machining.

## Promotion states

- `NOT_ELIGIBLE`: exact pair/order/context is missing, unsupported, or mismatched.
- `INCOMPLETE`: the pair is structurally valid, but required evidence or provenance is missing.
- `CONFLICTED`: a required fact has conflicting sources; no source is selected automatically.
- `ELIGIBLE_FOR_REVIEW`: all required physical facts are `VERIFIED`, directly sourced, and exactly bound. This is not approval.
- `APPROVED`: reserved for a separate explicit future review/promotion step and is never returned by this evaluator.

The current repository snapshot remains zero-ready. This workflow defines a
future path; it does not promote any current candidate.

## Exact pair and context binding

Promotion requires the requested system, explicit participant A and B profile
IDs, participant roles, and relationship context. The semantic order is part
of the evidence contract. Reversed participants are rejected; no profile
substitution, alias merge, or auto-reordering occurs.

The pair-binding assertion itself must be `VERIFIED` and carry accepted direct
provenance. Generic family evidence, isolated profiles, and relationship-token
rows cannot satisfy exact-pair binding.

## Required physical facts

Requirements are selected by relationship context and are intentionally
generic. They can include contact surfaces, contact depth, overlap, rebate,
seating, notch/end treatment, and assembly cross-section. `NOT_REQUIRED` is not
used as an escape hatch by this initial workflow; a future context-specific
exception would need an explicit documented justification.

Machine facts are separate. A candidate can become `ELIGIBLE_FOR_REVIEW` for
physical display while `machineGeometryEligible` remains `false`.

## Provenance and fact statuses

- `VERIFIED` required facts need a direct source with file or URL, page/drawing
  reference, organization, classification, and source note.
- Accepted direct classes are manufacturer assembly evidence, manufacturer CAD,
  fabrication evidence, and direct manufacturer technical evidence.
- Supporting catalogue/profile evidence cannot alone promote physical geometry.
- `PARTIAL` and `UNKNOWN` required facts remain incomplete.
- `CONFLICTED` required facts produce `CONFLICTED` and preserve the conflict.
- Profile dimensions, operation names, database relationships, schematic
  permission, and presentation geometry are never fallbacks.

## Existing freezes

The frozen `482.20` Frame ↔ `482.21` Mullion `FRAME_TO_MULLION` case remains
blocked. Catalogue sections, relationship evidence, schematic permission, and
dimensions cannot bypass its freeze. Current candidates including
`482.21 ↔ 482.18`, `482.30/482.30-K ↔ 482.05`, and `482.05 ↔ 482.15` remain
below `ELIGIBLE_FOR_REVIEW` with their current evidence.

## Synthetic verifier fixtures

The verifier uses an in-memory hypothetical exact pair whose required facts
all have direct manufacturer provenance. It must reach only
`ELIGIBLE_FOR_REVIEW`; the fixture is not imported into production evidence
and can never return `APPROVED`.

## Safety boundary

Direct evidence found is not automatic production readiness. A separate,
explicit review must decide whether evidence is accepted, whether the physical
gate may change, and whether any later implementation is safe. Until then,
UNKNOWN and BLOCKED remain intentional and correct.

# Human Evidence Review 01

## Purpose

`humanEvidenceReview.ts` records an explicit review decision for an evidence
promotion candidate. It separates human review from evidence collection,
promotion eligibility, physical geometry gates, and future promotion
application.

The model is read-only: it does not write evidence, alter historical records,
change geometry readiness, unlock physical geometry, create joints, generate
geometry, enable machining, or persist review state.

## Decisions

- `APPROVE` is structurally valid only when the supplied promotion evaluation
  is `ELIGIBLE_FOR_REVIEW` and the candidate is not under the active formal
  KMG freeze.
- `REJECT` records that the submitted evidence package is not accepted. It
  does not delete or alter evidence.
- `NEEDS_MORE_EVIDENCE` records that review is deferred pending additional
  evidence. The reviewer note is preserved; missing evidence is not invented.

Invalid approvals return `reviewStatus: INVALID` and validation errors. They do
not upgrade the promotion state.

## Approval boundary

Even a valid `APPROVE` result means only that a human approved the evidence
package for a future explicit promotion step. Every result has
`canApplyPromotion: false`.

Therefore:

`ELIGIBLE_FOR_REVIEW + APPROVE` does not imply `physicalGeometryGate = ALLOWED`
and does not imply machine readiness.

A separate future apply-promotion workflow must re-check source provenance,
exact pair/context binding, active freezes, conflicts, and required physical
facts before changing any evidence or gate state.

## Eligibility and freeze protection

Current candidates are below `ELIGIBLE_FOR_REVIEW`, so `APPROVE` is invalid for
them. The `482.20` Frame → `482.21` Mullion `FRAME_TO_MULLION` case is also
explicitly protected by the existing geometry freeze. A review decision cannot
bypass that freeze, even if a verifier-only synthetic promotion evaluation is
constructed for testing.

## Review metadata

The result preserves `reviewedBy`, `reviewedAt`, and `reviewNote` as supplied
metadata. No real user identity, clock value, authentication, persistence, or
global mutable review registry is introduced.

## Safety conclusion

Human review is a controlled decision record, not automatic promotion. UNKNOWN
facts remain UNKNOWN, blocked candidates remain blocked, and constructor and
runtime behavior are unchanged.

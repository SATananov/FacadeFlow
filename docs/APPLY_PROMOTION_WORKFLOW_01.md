# Apply Promotion Workflow 01

## Purpose

`applyEvidencePromotion.ts` is a second, independent revalidation barrier
between human review and any future evidence mutation. It returns a read-only
application plan only. It does not apply that plan.

No geometry, evidence record, freeze, constructor behavior, physical gate, or
machine state is changed by this workflow.

## Entry requirements

Application evaluation is possible only when both inputs are true:

1. `promotionEvaluation.promotionStatus` is `ELIGIBLE_FOR_REVIEW`;
2. `humanReview.decision` is `APPROVE` and `humanReview.valid` is true.

Otherwise the result is `NOT_APPLICABLE` with no application plan.

## Independent revalidation

The workflow re-evaluates the proposed facts and sources rather than trusting
the previous promotion result. It independently checks:

- exact system and participant identities;
- participant order and relationship context;
- required fact statuses and completeness;
- direct source classes and provenance fields;
- unresolved conflicts;
- identifier ambiguity, including 482.30 versus 482.30-K;
- active formal freezes;
- agreement between the supplied and revalidated promotion snapshots.

No alias, family substitution, profile replacement, or participant reorder is
accepted.

## Application states

- `NOT_APPLICABLE`: entry requirements are absent.
- `REVALIDATION_FAILED`: pair, context, facts, provenance, identifiers, or
  supplied evaluation fail the second check.
- `BLOCKED_BY_FREEZE`: the exact candidate is protected by an active freeze.
- `BLOCKED_BY_CONFLICT`: required evidence contains unresolved conflict.
- `READY_FOR_EXPLICIT_APPLY`: all checks pass and a future explicit mutation
  task may inspect the read-only plan.

`READY_FOR_EXPLICIT_APPLY` is not an APPLY command and is not production
readiness.

## Fact and provenance rules

Every required fact must remain `VERIFIED` with accepted direct provenance.
`PARTIAL`, `UNKNOWN`, and `CONFLICTED` facts cannot pass. Supporting catalogue,
database relationship, schematic, and dimension-only evidence cannot replace a
direct physical interface source.

The exact source file/URL, page or drawing reference, organization,
classification, and source note are independently checked. Conflicts are not
resolved by source priority.

## Freeze and identifier handling

The formal `482.20` Frame → `482.21` Mullion `FRAME_TO_MULLION` freeze remains
authoritative. Even a verifier-only synthetic approval cannot produce a ready
application for that pair.

The unresolved `482.30` / `482.30-K` mapping blocks application unless the
caller explicitly supplies an exact identifier resolution for the package.

## Read-only application plan

When ready, the plan describes facts and provenance that a future explicit task
would need to inspect, the exact pair/context, required verifier reruns, and
possible future gate consideration. It has `readOnly: true` and the result
always reports:

- `canMutateEvidence: false`;
- `canUnlockPhysicalGeometry: false`;
- `canEnableMachineGeometry: false`.

## Safety conclusion

This workflow does not persist review decisions, mutate evidence, unlock a
physical gate, create geometry, or enable machining. A future mutation task
must be explicit, separately reviewed, and revalidated again.

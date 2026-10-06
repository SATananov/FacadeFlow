# Authorized Evidence Mutation 01

## Purpose

`authorizedEvidenceMutation.ts` is the final read-only preparation layer in
the evidence chain. It may return `AUTHORIZED_FOR_MUTATION` only after all
earlier stages pass and a separate explicit authorization scope matches the
exact pair and context.

It does not execute a mutation, write evidence, change a freeze, unlock a
physical gate, generate geometry, alter constructor behavior, or enable
machining.

## Required safety chain

The input must contain all of the following:

1. promotion evaluation `ELIGIBLE_FOR_REVIEW`;
2. valid human review `APPROVE`;
3. application evaluation `READY_FOR_EXPLICIT_APPLY`;
4. `authorization.explicit = true`;
5. complete authorization metadata and exact scope.

The workflow then independently re-runs promotion and application evaluation
against the supplied facts and sources.

## Authorization scope

Authorization is separate from human review and binds the exact system,
participant A, participant B, participant order, and relationship context. It
cannot be inferred from UI selection, reviewer presence, eligibility, or prior
readiness. Mismatches fail final revalidation.

## Mutation states

- `NOT_AUTHORIZED`: explicit authorization or its metadata is absent.
- `NOT_READY`: the earlier promotion/review/application chain has not passed.
- `FINAL_REVALIDATION_FAILED`: exact identity, scope, facts, provenance,
  identifier, or prior-result consistency failed.
- `BLOCKED_BY_FREEZE`: an active formal freeze protects the exact candidate.
- `BLOCKED_BY_CONFLICT`: required evidence contains unresolved conflict.
- `AUTHORIZED_FOR_MUTATION`: a separate explicit execution task may inspect
  the read-only plan.

`AUTHORIZED_FOR_MUTATION` is not an execution command and is not a geometry
approval.

## Final fact and provenance checks

Only `VERIFIED` facts with non-null physical values and accepted direct source
provenance may enter the plan. `UNKNOWN`, `PARTIAL`, `CONFLICTED`, weak-source,
dimension-only, relationship-only, and schematic facts cannot mutate.

The strong source classes remain manufacturer assembly, manufacturer CAD,
fabrication, and direct manufacturer technical evidence. Exact source
location, organization, classification, and notes are checked again.

## Freeze and ambiguity protection

The formal `482.20` Frame → `482.21` Mullion `FRAME_TO_MULLION` freeze remains
authoritative and blocks authorization. The unresolved `482.30` versus
`482.30-K` mapping fails final revalidation unless explicitly resolved for the
exact package.

## Mutation plan semantics

The plan contains only exact pair/context identity, verified facts and
provenance to inspect, expected future status transitions, verifier reruns, and
separate gate reevaluation requirements. It is marked `readOnly: true`.

Every result reports:

- `canMutateEvidence: false`;
- `canUnlockPhysicalGeometry: false`;
- `canEnableMachineGeometry: false`.

## Future execution step

A separately authorized mutation task would need to revalidate this plan and
perform the actual evidence-state change. That task is intentionally not part
of this implementation.

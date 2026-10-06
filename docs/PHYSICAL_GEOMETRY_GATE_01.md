# Physical Geometry Gate 01

## Purpose

`physicalGeometryGate.ts` is a read-only evidence policy for one explicit participant order and relationship context. It answers whether direct physical assembly evidence is sufficient to permit `PHYSICAL_JOINT_GEOMETRY`. It does not generate geometry, assign profiles, create joints, or enable machining.

## Statuses

- `ALLOWED` requires a valid explicit participant order/context, `CAD_VERIFIED` physical evidence, and no missing required physical evidence category.
- `BLOCKED` means the explicit pair is known, but evidence or participant/order validation prevents physical geometry use.
- `UNKNOWN` means the participant, profile, or context data is incomplete and the gate cannot determine the pair without inventing a fallback.

## Required evidence

The gate tracks generic categories: direct profile-pair binding, contact definition, contact depth/seating, overlap/rebate, end treatment/notch, and assembly cross-section. These are evidence categories, not generated values.

Profile dimensions, `cuttingang`, operation names, database relationship tokens, and schematic permission cannot satisfy them.

## KMG reference case

For `kmg-prelude-60`, `482.20` Frame → `482.21` Mullion, `FRAME_TO_MULLION`, the catalogue sections are verified and the relationship context is supported. The physical fields remain UNKNOWN under `KMG_48220_48221_GEOMETRY_EVIDENCE_FREEZE01.md`, so the gate is `BLOCKED`.

Schematic permission does not unlock physical geometry. The schematic and physical gates remain separate.

## Promotion criteria

The KMG pair may leave `BLOCKED` only after a direct technical source is represented by the geometry-evidence/readiness layer with the required physical facts and exact participant/context binding. `ALLOWED` at this gate does not imply machine readiness; machine readiness remains a separate future decision.

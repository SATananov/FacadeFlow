# Geometry Agent

## Owns

- Topology.
- Coordinates.
- Fields.
- Dividers.
- Joints.
- Mitres.
- Resolved geometry.
- Structural geometric relationships.

Primary repository areas:

- `src/domain/construction/`
- `src/domain/profileAwareGeometry.ts`
- `src/domain/profileAwareSashGeometry.ts`
- `src/domain/profileJointGeometry.ts`
- `src/domain/profileDimensionalSemantics.ts`
- Geometry-relevant transforms in `src/components/constructorCoordinates.ts`
- Geometry verifiers in `scripts/verify-constructor01c*`, `scripts/verify-profile-aware-*`, and related feature verifiers.

## Must Not

- Change visual semantics merely for appearance.
- Invent catalogue dimensions, overlaps, insets, or clearances.
- Infer handing, hinge geometry, or threshold geometry.
- Convert sketch or UI preferences into production geometry.
- Change persistence, project schema, or Undo/Redo behavior without Orchestrator routing.

## Required Checks

- Classify all technical facts as VERIFIED, LIKELY, ASSUMED, or UNKNOWN.
- Keep ASSUMED and UNKNOWN values out of production geometry.
- Preserve field/divider/module identities.
- Preserve ZERO_DIVIDER semantics.
- Identify drawing and persistence impact explicitly.


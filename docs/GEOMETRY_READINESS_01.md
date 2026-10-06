# Geometry Readiness 01

## Purpose

`geometryReadiness.ts` is a read-only evidence gate above profile recognition, profile-resolution evidence, joint relationship evidence, and geometry evidence.

It reports what a relationship may safely display and which stronger uses remain blocked. It does not assign profiles, create joints, calculate contact, generate geometry, or enable machining.

## Readiness levels

- `PROFILE_CONTEXT_BLOCKED`: requested profile/system roles are not sufficiently recognized.
- `PROFILE_CONTEXT_READY`: profile display is supported, but relationship evidence is absent or unresolved.
- `RELATIONSHIP_CONTEXT_BLOCKED`: reserved for relationship-specific blocking when profile context exists but relationship evidence is not sufficient.
- `RELATIONSHIP_CONTEXT_READY`: relationship evidence exists, but this level does not itself authorize physical geometry.
- `SCHEMATIC_ONLY`: relationship context may be shown as an explicitly labelled non-physical schematic.
- `PHYSICAL_GEOMETRY_BLOCKED`: direct contact/assembly evidence is incomplete.
- `MACHINE_GEOMETRY_BLOCKED`: machining geometry, coordinates, or toolpath are incomplete.

The result also carries separate `physicalGeometryStatus` and `machineGeometryStatus` values. This prevents one boolean from hiding different evidence boundaries.

## Allowed uses

- `PROFILE_DISPLAY` requires recognized profile/system role evidence.
- `RELATIONSHIP_CONTEXT_DISPLAY` requires relationship evidence; absent evidence does not prove that a relationship is impossible.
- `SCHEMATIC_RELATIONSHIP_DISPLAY` may be allowed only when clearly labelled as non-physical and evidence-limited.
- `PHYSICAL_JOINT_GEOMETRY` is blocked until direct physical contact and assembly facts are verified.
- `MACHINING_GEOMETRY` is blocked until machining geometry, coordinates, and toolpath evidence are verified.

## KMG target example

For KMG PRELUDE 60 `482.20` Frame ↔ `482.21` Mullion in `FRAME_TO_MULLION`:

- profile identities and roles are supported;
- isolated sections are catalogue-verified;
- relationship tokens are database relationship evidence;
- the readiness result is `SCHEMATIC_ONLY`;
- physical joint geometry is `BLOCKED`;
- machining geometry is `BLOCKED`.

The result retains blockers for contact surfaces, contact depth, overlap, rebate, notch contour, mullion end treatment, cut dimensions, assembly cross-section, connector placement, machining coordinates, toolpath, and allowance data.

The freeze in `KMG_48220_48221_GEOMETRY_EVIDENCE_FREEZE01.md` remains authoritative. UNKNOWN is an intentional and valid result, not a failure to fill a field.

## No dimension fallback

`profileW`, `profileZ`, `dim_in`, `dim_out`, and `cuttingang` can describe imported profile records, but they cannot upgrade relationship or physical geometry readiness. The evaluator never uses envelope dimensions as contact, overlap, rebate, notch, cut, or machining evidence.

## Non-KMG behavior

For a system with profile evidence but no relationship evidence, profile display may remain allowed while relationship display, schematic relationship display, physical geometry, and machining remain blocked or unknown. The evaluator does not reorder reversed roles or infer a missing relationship.

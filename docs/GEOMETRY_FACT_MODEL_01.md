# Geometry Fact Model 01

`geometryFacts.ts` is a read-only model for physical joint facts. It records the status and provenance of each fact without generating coordinates, contours, cuts, joints, or machining data.

## Fact statuses

- `VERIFIED`: direct provenance is required.
- `PARTIAL`: provenance is required and the source must state what is partial.
- `UNKNOWN`: value is explicitly `null`; no invented source or measurement is attached.
- `CONFLICTED`: at least two source references are retained so a conflict is not silently resolved.

The model supports future direct evidence through `createGeometryFact`, but the current KMG pair has no verified physical joint facts.

## Fact categories

The model keeps contact surfaces, contact depth, overlap, rebate, seating, notch/end treatment, cut data, connector placement, assembly cross-section, machining, toolpath, and weld/allowance facts independent. A missing category remains independently UNKNOWN.

## KMG reference case

For `kmg-prelude-60`, explicit participant order `482.20` Frame → `482.21` Mullion, and `FRAME_TO_MULLION`, every physical fact is UNKNOWN. The catalogue verifies isolated sections only. `SglobkaDelitel`, `BeamHorizontalKMG4k`, `BeamVerticalKMG4k`, operation 19, `POS[]`, and `MM1/MM4` remain relationship evidence and do not populate fact values.

`KM242` is retained only as `SUPPORTING_CATALOGUE_EVIDENCE_ONLY`; its placement and physical geometry remain UNKNOWN.

## Boundaries

Profile dimensions, `dim_in`, `dim_out`, `cuttingang`, visual similarity, and schematic layout cannot populate physical facts. Participant order is explicit and is never auto-reordered. A non-KMG pair with missing evidence receives a valid UNKNOWN fact set rather than an incompatibility claim.

Future physical-gate integration may consume this fact set, but it must require the needed direct facts and must not weaken the existing blocked KMG gate. Machine readiness remains a separate decision.

# Drawing Agent

## Owns

- Technical sketch representation.
- Frame/sash/leaf visual structure.
- Inside/outside orientation.
- Visual layering.
- Technical line semantics.
- Opening symbols.
- Dimension presentation.
- Visible mitre semantics.

Primary repository areas:

- `src/components/ConstructorShell.tsx`
- `src/components/CompositeStructuralSketch.tsx`
- `src/components/compositeStructuralSketchProjection.ts`
- `src/components/assemblyTechnicalSectionGraphics.ts`
- `src/components/doorLeafVisual.ts`
- `src/components/fieldDimensionLabel.ts`
- Related component CSS files.
- Drawing verifiers such as `scripts/verify-constructor01e*`, `scripts/verify-constructor-technical-drawing*`, `scripts/verify-door-*`, and `scripts/verify-field-dimensions-opening-symbol-clarity01.mjs`.

## Must Not

- Invent geometry or catalogue facts.
- Change topology, resolved dimensions, profile assignments, or persistence to make a visual issue look better.
- Treat presentation-only dimensions as engineering dimensions.
- Convert visual requirements into domain facts.

## Required Checks

- State whether the change is presentation-only or geometry-affecting.
- Request Geometry Agent review if structural coordinates or topology are touched.
- Request Profile/Catalog Agent review if real profile facts are displayed or interpreted.
- Require human visual acceptance for visual drawing changes.


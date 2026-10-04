# Orchestrator

The Orchestrator coordinates work. It normally does not directly implement changes when a specialized agent should own the work.

Only the Orchestrator may declare:

`READY FOR HUMAN REVIEW`

## Runtime Modes

Use true multiple/subagents only when the current runtime is VERIFIED SUPPORTED for autonomous subagent spawning/orchestration.

If support is not VERIFIED SUPPORTED, use Sequential Role Mode:

1. Orchestrator produces a routing plan before implementation.
2. The selected specialist role implements and produces a `READY FOR VERIFICATION` handoff.
3. Verifier role re-reads `.ai/GLOBAL_RULES.md`, the relevant skill/protocol files, and the diff independently.
4. Verifier must not repair implementation.
5. Orchestrator consolidates and may declare `READY FOR HUMAN REVIEW`.

The same runtime agent may perform all phases, but each role transition must be explicit in the transcript/report.

## Responsibilities

- Classify the user task.
- Identify affected domains.
- Select the primary implementation agent.
- Select supporting review agents.
- Detect cross-domain risk.
- Sequence work.
- Require independent verification.
- Consolidate reports.
- Preserve `.ai/GLOBAL_RULES.md`.

## Required Initial Inspection

Before routing a task, inspect the real repository state. Do not guess source paths from the prompt.

For FacadeFlow, the current mapped areas are:

- Domain/topology: `src/domain/construction/`, `src/domain/compositeModuleStructure.ts`, `src/domain/openingGroups.ts`, `src/domain/offerModules.ts`.
- Geometry: `src/domain/profileAwareGeometry.ts`, `src/domain/profileAwareSashGeometry.ts`, `src/domain/profileJointGeometry.ts`, `src/domain/profileDimensionalSemantics.ts`, `src/components/constructorCoordinates.ts`.
- Drawing/rendering: `src/components/ConstructorShell.tsx`, `src/components/CompositeStructuralSketch.tsx`, `src/components/compositeStructuralSketchProjection.ts`, `src/components/assemblyTechnicalSectionGraphics.ts`, `src/components/doorLeafVisual.ts`, `src/components/fieldDimensionLabel.ts`.
- Profile/catalog/evidence: `src/data/profileSystems/`, `src/assets/catalog/prelude60/`, `src/domain/profileResolution.ts`, `src/domain/glazingEvidence.ts`, `src/domain/glazingContext.ts`, `src/domain/componentCompatibility.ts`.
- UI/UX: `src/App.tsx`, `src/components/*Panel.tsx`, `src/components/ConstructorShell.tsx`, `src/components/GlobalGuidance.tsx`, CSS files.
- Verification/scripts: `scripts/verify-*`, `scripts/runtime-loader.mjs`, `package.json`.
- Persistence/history: `src/domain/project/`, `src/persistence/`, `src/hooks/useProjectWorkspace.ts`, `src/domain/assurance/`.
- Assembly: `src/domain/assembly/`, `src/components/AssemblyReviewPanel.*`, `src/components/assemblyTechnicalSectionGraphics.ts`.

## Cross-Domain Risk

Escalate to multi-role review when touching:

- `src/components/ConstructorShell.tsx`
- `src/hooks/useProjectWorkspace.ts`
- `src/domain/project/projectSerialization.ts`
- `src/domain/project/projectOperations.ts`
- `src/domain/project/revisionOperations.ts`
- `src/domain/construction/fieldTopology.ts`
- `src/domain/profileResolution.ts`
- `src/components/compositeStructuralSketchProjection.ts`
- `src/components/CompositeStructuralSketch.tsx`
- `src/App.tsx`

## Routing Rules

- Geometry/domain changes require Geometry Agent participation.
- Drawing/sketch changes require Drawing Agent participation.
- Catalogue facts require Profile/Catalog Agent or Evidence Agent review.
- UI workflow changes require UI/UX Agent participation.
- Persistence/history changes require Orchestrator cross-domain handling and Verifier review.
- Completed implementation always goes to Verifier Agent.
- Human visual acceptance remains required for visual drawing changes.
- Commit is separate from implementation acceptance.

## Status Values

Allowed statuses:

- INSPECTING
- IMPLEMENTING
- BLOCKED
- READY FOR VERIFICATION
- VERIFIED
- FAILED
- READY FOR HUMAN REVIEW

## Orchestration Examples

### A. Outside Door View Visual Issue

Expected routing:

1. Orchestrator classifies as drawing/visual orientation.
2. Drawing Agent primary.
3. Profile/Catalog Agent facts check if profile facts are referenced.
4. Geometry Agent only if structural geometry change is proposed.
5. Verifier Agent runs drawing/orientation verifiers, lint, build if source changed.
6. Human visual review is required.

### B. Divider Geometry Issue

Expected routing:

1. Orchestrator classifies as geometry/topology.
2. Geometry Agent primary.
3. Drawing Agent reviews visual consequences.
4. Profile/Catalog Agent reviews only if profile-derived divider dimensions are involved.
5. Verifier Agent runs constructor/divider/profile geometry verifiers, lint, build.

### C. New PRELUDE Profile Fact

Expected routing:

1. Orchestrator classifies as catalogue/evidence.
2. Evidence Agent gathers and classifies provenance.
3. Profile/Catalog Agent primary for mapping the fact.
4. Geometry Agent reviews only if the fact changes production geometry.
5. Verifier Agent runs profile/catalog/evidence verifiers, lint, build.

### D. Constructor UX Issue

Expected routing:

1. Orchestrator classifies as UI/UX.
2. UI/UX Agent primary.
3. Geometry, Drawing, or Profile/Catalog Agents review if the proposed UX changes expose or alter domain semantics.
4. Verifier Agent runs constructor UX verifier(s), lint, build.
5. Human visual review if layout or sketch interpretation changes.

### E. Mixed Task Affecting Drawing and Geometry

Expected routing:

1. Orchestrator splits the work into domain-safe units.
2. Geometry Agent owns structural model or resolved coordinate changes.
3. Drawing Agent owns sketch representation changes.
4. Supporting agents review before implementation crosses boundaries.
5. Verifier Agent independently verifies the full combined diff.
6. Orchestrator consolidates results and requests human review when visual interpretation changed.

# FacadeFlow Multi-Agent Framework

This directory defines repository-local agent roles, boundaries, and handoff protocols for FacadeFlow work. It is documentation and coordination infrastructure only.

The framework can be used in either runtime mode:

- A runtime with true multiple/subagents may assign these files to separate agents.
- A single agent may sequentially assume the specialized roles described here.

Do not claim parallel autonomous subagents are available unless the runtime actually supports them.

## Sequential Role Mode

Sequential Role Mode is first-class and required whenever true autonomous subagent support is not VERIFIED SUPPORTED.

In Sequential Role Mode, one runtime agent explicitly changes roles in the transcript/report:

1. Orchestrator phase: read `.ai/GLOBAL_RULES.md`, inspect the task, identify affected domains, and produce a routing plan before implementation.
2. Specialist phase: assume the selected primary skill role, inspect relevant files, implement only the assigned scope, and produce a `READY FOR VERIFICATION` handoff.
3. Verifier phase: re-read the diff and rules independently, run the required checks, and do not repair implementation.
4. Orchestrator consolidation phase: consolidate implementation and verification results, then declare `READY FOR HUMAN REVIEW` only if the criteria are met.

The same model/runtime may perform these phases, but each role transition must be explicit.

## Required Entry Point

Start every non-trivial task with `.ai/ORCHESTRATOR.md`.

The Orchestrator must:

1. Inspect the current repository state.
2. Classify the task.
3. Identify affected domains.
4. Select a single primary implementation owner.
5. Assign supporting review roles.
6. Route completed work to the Verifier Agent.
7. Stop for human review when appropriate.

Only the Orchestrator may declare `READY FOR HUMAN REVIEW`.

## Repository Map

Current architectural areas observed before creating this framework:

- Domain/topology: `src/domain/construction/`, especially `constructionModel.ts` and `fieldTopology.ts`; `src/domain/compositeModuleStructure.ts`; `src/domain/openingGroups.ts`; `src/domain/offerModules.ts`.
- Geometry: `src/domain/profileAwareGeometry.ts`, `src/domain/profileAwareSashGeometry.ts`, `src/domain/profileJointGeometry.ts`, `src/domain/profileDimensionalSemantics.ts`, selected construction topology resolvers, and view transforms in `src/components/constructorCoordinates.ts`.
- Drawing/rendering: `src/components/ConstructorShell.tsx`, `src/components/CompositeStructuralSketch.tsx`, `src/components/compositeStructuralSketchProjection.ts`, `src/components/assemblyTechnicalSectionGraphics.ts`, `src/components/doorLeafVisual.ts`, `src/components/fieldDimensionLabel.ts`, and related CSS.
- Profile/catalog/evidence: `src/data/profileSystems/`, `src/assets/catalog/prelude60/`, `src/domain/profileResolution.ts`, `src/domain/glazingEvidence.ts`, `src/domain/glazingContext.ts`, `src/domain/componentCompatibility.ts`, and `src/domain/hardwareResolution.ts`.
- UI/UX: `src/App.tsx`, `src/App.css`, `src/components/ConstructorShell.tsx`, project/model/assurance panels, global guidance components, and component CSS files.
- Verification/scripts: `scripts/verify-*.mjs`, `scripts/verify-*.ts`, `scripts/runtime-loader.mjs`, and `package.json` scripts including `lint`, `build`, `verify`, and feature-specific test commands.
- Persistence/history: `src/domain/project/`, `src/persistence/`, `src/hooks/useProjectWorkspace.ts`, and assurance revision/history modules under `src/domain/assurance/`.
- Assembly: `src/domain/assembly/`, `src/components/AssemblyReviewPanel.*`, `src/components/assemblyTechnicalSectionGraphics.ts`, and assembly acceptance/verifier files.

## Cross-Domain Files

These files should not be treated as owned by a single specialized implementation role:

- `src/components/ConstructorShell.tsx`: UI, drawing, topology, profile resolution, glazing, hardware, and project workflow meet here.
- `src/hooks/useProjectWorkspace.ts`: persistence, project graph updates, construction drafts, profile resolution reconciliation, assurance, and revision workflows meet here.
- `src/domain/project/projectSerialization.ts`: persistence schema, topology validation, profile resolution validation, and migration safety meet here.
- `src/domain/project/projectOperations.ts`: project graph mutation, module lifecycle, and persistence-facing semantics meet here.
- `src/domain/project/revisionOperations.ts`: immutable history, evidence pinning, and revision semantics meet here.
- `src/domain/construction/fieldTopology.ts`: topology, coordinates, field/divider identities, and resolved geometry meet here.
- `src/domain/profileResolution.ts`: profile/catalog assignments meet topology targets and field semantics.
- `src/components/compositeStructuralSketchProjection.ts`: domain composite structure is projected into presentation units.
- `src/components/CompositeStructuralSketch.tsx`: technical sketch rendering includes ZERO_DIVIDER semantics and presentation-only dimensions.
- `src/App.tsx`: workflow-level composition and app behavior meet UI state.

Cross-domain changes require Orchestrator sequencing and Verifier review.

## Files

- `GLOBAL_RULES.md`: non-negotiable safety boundaries.
- `ORCHESTRATOR.md`: routing and reporting rules.
- `skills/*.md`: specialized role scopes.
- `protocols/*.md`: task handoff, change control, and human review protocol.

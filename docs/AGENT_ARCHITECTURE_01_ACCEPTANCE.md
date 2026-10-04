# Agent Architecture 01 Acceptance

## Files Created

- `.ai/README.md`
- `.ai/GLOBAL_RULES.md`
- `.ai/ORCHESTRATOR.md`
- `.ai/skills/geometry.md`
- `.ai/skills/drawing.md`
- `.ai/skills/profile-catalog.md`
- `.ai/skills/ui-ux.md`
- `.ai/skills/verifier.md`
- `.ai/skills/evidence.md`
- `.ai/protocols/task-handoff.md`
- `.ai/protocols/change-control.md`
- `.ai/protocols/human-review.md`
- `docs/AGENT_ARCHITECTURE_01_ACCEPTANCE.md`

## Repository Areas Mapped

VERIFIED from repository inspection:

- Domain/topology: `src/domain/construction/`, `src/domain/compositeModuleStructure.ts`, `src/domain/openingGroups.ts`, `src/domain/offerModules.ts`.
- Geometry: `src/domain/profileAwareGeometry.ts`, `src/domain/profileAwareSashGeometry.ts`, `src/domain/profileJointGeometry.ts`, `src/domain/profileDimensionalSemantics.ts`, `src/components/constructorCoordinates.ts`.
- Drawing/rendering: `src/components/ConstructorShell.tsx`, `src/components/CompositeStructuralSketch.tsx`, `src/components/compositeStructuralSketchProjection.ts`, `src/components/assemblyTechnicalSectionGraphics.ts`, `src/components/doorLeafVisual.ts`, `src/components/fieldDimensionLabel.ts`, related CSS files.
- Profile/catalog/evidence: `src/data/profileSystems/`, `src/assets/catalog/prelude60/`, `src/domain/profileResolution.ts`, `src/domain/glazingEvidence.ts`, `src/domain/glazingContext.ts`, `src/domain/componentCompatibility.ts`, `src/domain/hardwareResolution.ts`.
- UI/UX: `src/App.tsx`, `src/App.css`, `src/components/*Panel.tsx`, `src/components/ConstructorShell.tsx`, `src/components/GlobalGuidance.tsx`, component CSS files.
- Verification/scripts: `scripts/verify-*`, `scripts/runtime-loader.mjs`, `package.json` scripts.
- Persistence/history: `src/domain/project/`, `src/persistence/`, `src/hooks/useProjectWorkspace.ts`, `src/domain/assurance/`.
- Assembly: `src/domain/assembly/`, `src/components/AssemblyReviewPanel.*`, `src/components/assemblyTechnicalSectionGraphics.ts`.

## Role Boundaries

- Orchestrator: task classification, affected-domain analysis, role selection, sequencing, verification routing, final consolidation.
- Geometry Agent: topology, coordinates, fields, dividers, joints, mitres, resolved geometry, structural geometric relationships.
- Drawing Agent: technical sketch representation, visual structure, orientation, layering, line semantics, opening symbols, dimension presentation, visible mitres.
- Profile/Catalog Agent: profile roles, catalogue evidence, PRELUDE 60 facts, glass/bead relationships, verified dimensions, profile identity mapping.
- UI/UX Agent: interaction, navigation, panels, guidance/help, labels, responsive UX, workflow clarity.
- Evidence Agent: catalogue/PDF research, acceptance documents, manufacturer evidence, external architectural observations, evidence provenance.
- Verifier Agent: independent diff inspection, verifier selection/execution, lint/build, regression and safety-boundary checks.

## Cross-Domain Files

These files were identified as requiring Orchestrator routing rather than single-agent ownership:

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

## Global Safety Rules

The framework records these mandatory boundaries:

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO
- UNKNOWN FACTS MUST REMAIN UNKNOWN

It also records:

- Never invent catalogue dimensions.
- Never infer handing when it is not explicitly known.
- Never convert visual requirements into domain facts.
- Never change geometry only to improve visual appearance.
- Never silently change persistence semantics.
- Never silently change Undo/Redo behavior.
- Existing verified behavior must be preserved unless the task explicitly replaces it.
- Evidence must be classified as VERIFIED, LIKELY, ASSUMED, or UNKNOWN.
- ASSUMED and UNKNOWN values must not enter production geometry as facts.
- No agent commits or pushes without explicit human instruction.

## Orchestration Workflow

1. Orchestrator inspects current repository state.
2. Orchestrator classifies the task and affected domains.
3. Orchestrator assigns one primary implementation owner.
4. Supporting agents review or advise rather than concurrently editing by default.
5. Cross-domain risks are sequenced explicitly.
6. Completed implementation goes to Verifier Agent.
7. Orchestrator consolidates implementation and verification reports.
8. Only Orchestrator may declare `READY FOR HUMAN REVIEW`.

## Verification Workflow

For source-code changes:

1. Verifier Agent inspects the diff.
2. Verifier Agent identifies affected verifier scope.
3. Verifier Agent runs relevant feature-specific verifiers.
4. Verifier Agent runs `npm run lint`.
5. Verifier Agent runs `npm run build`.
6. Verifier Agent runs `git diff --check`.
7. Verifier Agent reports `git status --short`.
8. If repair is required, Verifier Agent returns the task to Orchestrator and does not repair directly.

For documentation-only changes, the minimum final check is:

1. `git diff --check`
2. `git status --short`
3. Confirm no existing application/source behavior file changed.

## Runtime Limitation

This framework does not claim that true parallel autonomous subagents are available. It supports both:

- Runtime-supported multiple/subagents.
- One agent sequentially assuming specialized roles using these skill files.

Local runtime capability hardening result:

- Current local Open Interpreter CLI help showed session-management commands such as `agents`, `queue`, `resume`, and `fork`, but did not verify true autonomous subagent spawning/orchestration.
- Runtime support is therefore classified as UNKNOWN.
- Sequential Role Mode is required unless future runtime evidence upgrades support to VERIFIED SUPPORTED.

## Sequential Role Mode

When runtime support is UNKNOWN or VERIFIED NOT SUPPORTED:

1. Orchestrator phase produces a routing plan before implementation.
2. Specialist phase implements only the assigned role scope and produces a `READY FOR VERIFICATION` handoff.
3. Verifier phase re-reads the diff and rules independently and must not repair implementation.
4. Orchestrator consolidates and may declare `READY FOR HUMAN REVIEW`.
5. The same model/runtime may perform these phases, but each transition must be explicit in the transcript/report.

## Known Limitations

- The framework is documentation infrastructure only; it does not enforce permissions programmatically.
- Agent routing depends on the active runtime or human operator following these files.
- Human visual acceptance remains required for drawing/sketch changes.
- Catalogue facts still require independent source verification before production use.
- SkyGlazing observations may inform architecture, but they are not FacadeFlow catalogue facts unless independently verified.

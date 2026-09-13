# AF01A — Resolver Foundation

Baseline: `FacadeFlow_PROJECT_OPEN_01_1_CLEAN_20260912.zip`, SHA-256
`047740428888713473497e87fa9cec1e290d15ec149b415412039f5883a7f092`.

Implementation boundary: AF01A only. Real PRELUDE 60 FIX and OPERABLE cases
produce **partial / ASSEMBLY_RESOLUTION BLOCKED**. AF01B Technical Reference
Closure is not implemented. No positive physical technical rules were added.

## Behaviour

- `ResolvedAssembly` is an immutable derived read model. `coverageStatus`
  (`complete | partial | unresolved | invalid`) is separate from readiness.
- Tuple-hashed member, connection, infill, requirement and blocker identities
  preserve canonical Project / Offer / Module / FIELD / divider references.
- Frame and sash sides are semantic positions. Physical realization and joint
  specifications remain independently unresolved; they are not cut pieces.
- Profile/component choices, catalog candidates, reviewed front-elevation
  facts, physical requirements and later manufacturing requirements are distinct.
- Draft binding uses canonical revision-content fingerprinting, excluding UI
  navigation. Recorded binding uses the exact requested revision ID and digest.
- Dependencies cover canonical content, catalog records, evidence/source
  records, rule bundle, gate contract and resolver version. Draft invalidation
  is conservatively project-wide because the binding names an exact draft.
- Historical results require the exact available interpretation. Changed
  historical evidence is blocked as `HISTORICAL_RULE_UNAVAILABLE`, not silently
  interpreted with the latest rules.
- Readiness regenerates the expected result and checks both content integrity
  and dependencies. Recomputing a forged result's digest cannot authorize it.
- `BOM`, `QUOTATION`, `GLASS_ORDER`, `PRODUCTION_RELEASE`, and `MACHINE_EXPORT`
  always return actionable `STAGE_NOT_IMPLEMENTED` blockers in AF01A.
- No derived assembly is persisted. No existing graph, assignment, revision,
  confirmation, predicate-registry or local-storage schema was changed.

## Narrow support contracts

Both contracts require PRELUDE 60, a window, one unsplit rectangular FIELD,
frame 482.30, explicitly entered 24 mm glazing and human-selected bead 482.15.
Missing inputs remain actionable; other catalog choices are not automatically
declared physically incompatible merely because they fall outside AF01A.

- FIX: fixed FIELD, no sash or opening hardware kit.
- OPERABLE: sash 482.05, side-hinged, right handing under existing Constructor
  semantics, standard-european inherited hardware context. The standard is not
  invented for a free module that has no hardware settings.

Dividers, polygon fields, doors, other openings and other systems remain outside
the initial support contract. Divider identities remain visible in diagnostics;
unsupported topology is not flattened into a false single supported infill.

## Remaining technical blockers

No real evidence closes frame/sash member realization, frame/sash corners,
physical frame/sash interfaces, bead/base compatibility, glazing seats,
seal/gasket specifications, reinforcement applicability, or accessory
applicability. Reinforcement selection/catalog matching does not prove need,
member placement, or adequacy.

Glazing inset, glass cuts, manufacturing lengths/allowances, structural/load
adequacy and concrete OPERABLE hardware kits remain explicitly unresolved.
These later obligations do not automatically become universal assembly-gate
prerequisites. Assembly physical-interface blockers remain independently visible.

The existing 42 / 56 mm visible-face values and 22 mm overlap are preserved only
as limited reviewed front-elevation facts. They are not manufacturing deductions.

## Synthetic test boundary

The real baseline rule bundle has zero physical closure rules. A separate
`synthetic-mechanics-only` injection contract exists exclusively to exercise
resolver mechanics. Its evidence and READY assessment are explicitly marked
synthetic, non-production and non-reference. Baseline bundles reject those
positive rules. The review UI accepts no custom rule bundle and uses the real
baseline only. Synthetic READY never opens a future gate.

## Assembly Review UI

The project command strip contains `Преглед на сглобката`. Its read-only modal
shows support classification, partial/blocked coverage, exact unresolved
requirements by target, next steps, limited known facts and separate activity
gates. It uses native dialog focus/modal semantics, Escape/close controls and
focus return. No edit, save or confirmation callback is accepted.

## Changed files relative to accepted baseline

Modified:

- `src/App.tsx` — review entry wiring only.
- `package.json` — targeted AF01A command and full-verification integration.

Added:

- `src/domain/assembly/assemblyModel.ts`
- `src/domain/assembly/assemblyInput.ts`
- `src/domain/assembly/assemblyRules.ts`
- `src/domain/assembly/resolveAssembly.ts`
- `src/domain/assembly/assemblyReadiness.ts`
- `src/domain/assembly/assemblySelectors.ts`
- `src/components/AssemblyReviewPanel.tsx`
- `src/components/AssemblyReviewPanel.css`
- `scripts/verify-assembly-foundation01a-runtime.mjs`
- this acceptance record.

All other accepted source and verification files were compared directly with
the ZIP and remain unchanged. Pre-existing workspace changes were preserved.

## Verification

- `npm run test:assembly-foundation01a`: 38 runtime checks passed, including
  deterministic results and identities, real FIX/OPERABLE partial/BLOCKED,
  synthetic-only READY, missing/invalid inputs and evidence, unsupported
  topology, stale/changed/conflicting rules, unavailable historical rules,
  tampering, zero mutation, gate isolation and rendered review content.
- `npm run test:project-foundation01-runtime`: 27 passed.
- `npm run test:project-foundation02-runtime`: 57 passed.
- `npm run test:glazing-context01b`: passed.
- `npm run test:glazing-context01b-runtime`: passed.
- `npm run verify`: full contract suite, lint and build passed.
- `npm run lint`: passed independently.
- `npm run build`: passed independently.

Vite reports a non-fatal bundle-size warning (main JavaScript approximately
508 kB minified). No build or test failure remains.

Browser preview confirmed the entry in the project command strip. Open review
content is covered by rendered-component runtime checks; full interactive
browser workflow automation was not completed.

No commit or push was performed.

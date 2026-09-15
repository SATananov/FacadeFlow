# FacadeFlow 0.1.8 — Final Release Acceptance

FacadeFlow 0.1.8 closes the 0.1.8B → 0.1.8E.1 line as one release checkpoint.

## Included accepted stages

- **0.1.8B — Atomic Module History 01**
  - Undo/Redo restores construction, profile resolution and module product type as one technical snapshot.
  - Per-module history remains session-only and isolated while switching modules.
- **0.1.8C — Form → Constructor Transition 01**
  - Preset FIELD semantics transfer only when canonical FIELD identity/count is safe.
  - Manual/custom descriptions remain human-resolved.
  - No divider or geometry is fabricated from form descriptions.
- **0.1.8D — FIELD Glazing Ownership 01**
  - Effective glazing ownership is FIELD override > module override > offer default.
  - Human thickness overrides invalidate incompatible bead assignments.
  - No automatic bead replacement is introduced.
- **0.1.8E — Integrated Acceptance 01**
  - Two independently configured modules remain isolated.
  - Edit / Undo / Redo and Reset / Undo restore complete technical state.
  - Save / reopen preserves persisted technical state and active module identity.
- **0.1.8E.1 — Human Undo Session Hotfix V2**
  - The first technical edit makes Undo available synchronously.
  - Undo publishes Redo history synchronously before restored-state callbacks can remount the Constructor.
  - Per-module session history cache is updated synchronously.

## Release version contract

The following must all be exactly `0.1.8`:

- `package.json` → `version`
- `package-lock.json` → top-level `version`
- `package-lock.json` → `packages[""] .version`
- `src/appVersion.ts` → `APP_VERSION`

The package manifest must keep the desktop toolchain declared:

- `electron: 44.3.0`
- `electron-builder: 26.15.3`

A fresh source checkpoint must run `npm install` before the final verification so npm can materialize/synchronize the complete lock graph and desktop dependencies on the target machine.

## Release gate

`npm run verify` is the final 0.1.8 gate and must run:

1. the historical contract suite;
2. the 0.1.8 release metadata verifier;
3. the 0.1.8B / C / D / E / E.1 acceptance line;
4. lint;
5. production build.

`npm run verify:release018` is an explicit alias for the same final gate.

## Production boundaries

- AUTOMATIC GEOMETRY: **NO**
- AUTOMATIC BEAD SELECTION: **NO**
- RULES VALIDATED: **NO**
- MACHINE READY: **NO**
- SESSION UNDO HISTORY PERSISTED AFTER APP RESTART: **NO**

These boundaries remain deliberate. Release 0.1.8 closes the current workflow/integration checkpoint; it does not declare manufacturing automation ready.

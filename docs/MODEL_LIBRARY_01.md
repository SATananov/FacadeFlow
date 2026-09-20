# MODEL LIBRARY 01

System → profile catalogue → user-created saved models. No FIELD assignments,
module changes, production geometry, or replacement of Profile Resolution.

- `FacadeModel` stores stable UUID identity, name, system ID, three nullable
  profile codes, creation/update timestamps and schema version 1.
- Null means manually unassigned, following existing Profile Resolution.
  Saving does not assert completeness. There is no product type or geometry.
- Frame uses catalogue `frame`; divider uses `mullion`; sash accepts catalogue
  `sash` and `door-sash`, since the model has no window/door context.
- Domain validation checks exact system membership and catalogue role on both
  create and update, independently of UI filtering. Assembly compatibility is
  always `UNKNOWN / HUMAN REVIEW` at this stage.
- `LocalModelLibraryStorage` reads/writes a versioned envelope at localStorage
  key `facadeflow.model-library-01`, separate from all project snapshots.
  Models survive project changes in the same local app/browser storage.
  Operations: list, filter by system, getById, create, update, duplicate, delete.
  Duplicate creates a new UUID; edit preserves UUID and creation time.
- Storage reads validate all records and reject malformed/unknown versions or
  duplicate identities. Failed reads never become empty writable libraries;
  failed writes retain the previous stored data and the UI editing draft.
  Each operation reads the latest envelope and performs one atomic setItem.
  Simultaneous editing across multiple app windows is not synchronized.
- Navigation: **Модели → Библиотека модели**. Choose a system, select catalogue
  profiles manually, enter a name, save. Includes list filtering, edit, duplicate,
  confirmed deletion, reload, and visible storage errors. System changes clear
  invalid profile choices without auto-selecting replacements.

Automated verification (no application/browser startup):

```
node scripts/verify-model-library01.mjs
npm run verify
npm run lint
npm run build
```

The verifier covers domain/storage operations, invalid input, corrupted storage,
write errors, panel event handlers using an in-memory hook harness, and unchanged
Constructor topology/Profile Resolution baselines. UI visual acceptance is manual.



MACHINE READY = NO

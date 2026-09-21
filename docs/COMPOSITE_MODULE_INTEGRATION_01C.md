# COMPOSITE MODULE INTEGRATION 01C

## Scope

01C binds the approved Composite Module Structure domain to a concrete `ProjectModule` and persists it through the existing project storage flow. It remains an additive structural layer only.

## Ownership

A `ProjectModule` may own one optional `compositeStructure`.

- A legacy module with no `compositeStructure` remains valid.
- The structure is not stored in a separate global store.
- Deleting a module deletes its structure with the module because the structure is owned inline by `ProjectModule`.
- Different modules own independent structures.

## Canonical profile system

The existing module definition remains the single authority for the profile system:

- free module: `definition.profileSystemId`
- offer module: `definition.draft.inheritedDefaults.profileSystemId`

`compositeStructure.systemId` must equal that canonical module system. A saved composite structure locks system changes for that module. The implementation does not silently delete or convert the structure when the system changes.

## Persistence and backward compatibility

`compositeStructure` is an optional additive property of the current project module representation. Existing PF02 projects without the property remain valid and round-trip without adding it.

Historical PF01 input remains strict: PF01 does not accept the later `compositeStructure` property. PF01 migration therefore does not reinterpret later data as an older schema. Current PF02 graph and revision validation explicitly allow the optional structure.

The public `validatePF01Snapshot` has no flag to relax that contract. Shared graph validation is private; the PF02 revision callback accepts composite data only in the current revision context. Unknown future module properties are rejected by both schemas. Valid PF01 input is upgraded through `deserializeProject` and the existing canonical migration.

Stored structures are validated through `validateCompositeModuleStructure` and the module/system binding validator. Malformed structures, unsupported structure versions, or system mismatches block loading instead of being silently repaired.

## Editing semantics

The module-bound editor works on a detached draft:

- opening the editor clones the current saved structure, or starts a new draft for the module system;
- field edits do not mutate project state;
- `Запази` validates and persists only the target module;
- `Откажи` closes the editor without changing the saved project structure;
- stale-editor writes are rejected if the saved structure changed after the editor was opened;
- storage failures keep the editor draft open and do not replace the in-memory project snapshot with an unpersisted structure.

The UI identifies the concrete module being edited and uses the module's canonical system as read-only context.

## Module updates and deletion

Normal free/offer module updates preserve an existing composite structure when the module identity is retained. A system change is rejected while a saved structure exists.

Removing the module removes the inline structure with it, so no orphan composite storage exists.

Copying a free module to an offer copies the structure by value. The copied module therefore has an independent structure with stable internal IDs and the same explicit frame-side data.

`window` and `door` describe function only. Neither changes `frameSides`: doors with `bottom=false` and doors with `bottom=true` are both valid, as are explicit window side selections.

## Change tracking

Composite structure changes participate in the module dependency digest. Older modules with absent/null structures preserve the legacy digest shape, while a saved structure invalidates stale module-dependent review evidence as expected.

## Intentionally deferred

01C does **not** add:

- Constructor FIELD integration;
- saved Model assignment;
- automatic application of frame/divider/sash profiles;
- automatic layout or placement;
- exact ZERO_DIVIDER geometry;
- cut, overlap, inset, connector, machining, or reinforcement rules;
- production validation.

`fieldIds` remain empty in the current UI workflow. `ZERO_DIVIDER` remains a structural semantic relationship only.

## Automated acceptance

Run `node scripts/verify-composite-module-integration01c.mjs` explicitly; the existing `npm run verify` command does not include the composite 01A/01B/01C scripts.

The 01C verifier exercises real project operations, serialization, `LocalProjectStorage` with in-memory storage, and panel/workspace event harnesses. It covers lossless free/offer round trips, schema boundaries, stable IDs, explicit sides/dimensions/profiles, ZERO_DIVIDER, independent modules, deletion, rejected invalid/mismatched/stale writes, storage failure, revision tracking, and Cancel/Save/reopen through the actual workspace hook. Existing nonempty split topology and profile assignments are compared before and after composite saves. Protected topology and Model Library files also have source fingerprint checks.

The event harness runs without a browser and does not emulate React effects or visual layout. The remaining human test is: open an existing module, create/edit Window 1500×1500 plus Door 700×2000 with explicit `bottom=false` and ZERO_DIVIDER, Save, leave the module, reopen it. PASS if the structure is unchanged.

## Safety boundaries

- `AUTOMATIC GEOMETRY = NO`
- `RULES VALIDATED = NO`
- `MACHINE READY = NO`
- `ZERO DIVIDER EXACT GEOMETRY = UNKNOWN`
- `FRAME-TO-FRAME COMPATIBILITY = HUMAN REVIEW`
- `EXACT CUT / OVERLAP / INSET = UNKNOWN`

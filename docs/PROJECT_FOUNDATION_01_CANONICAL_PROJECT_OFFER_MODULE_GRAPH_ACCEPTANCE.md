# PROJECT FOUNDATION 01 — Canonical Project / Offer / Module Graph

## Status

IMPLEMENTED / RUNTIME VERIFIED. Human browser acceptance remains the final UI confirmation before declaring the stage closed.

## Scope

PROJECT FOUNDATION 01 introduces a canonical, serializable project graph around the existing Constructor without changing Construction topology or adding production logic.

Canonical ownership:

`Project -> Offer -> Module -> construction/profile payload`

The existing `ConstructionModel` / FIELD topology and `ModuleProfileResolution` remain separate domain models. Constructor interaction state such as tool selection, pointer drag state, pan, zoom, Auto Fit, inspector focus and Undo/Redo remains local UI/session state.

## Identity contract

- Project, Offer and Module use stable IDs created independently of display numbering.
- `Module.sequence` is display ordering only and is never identity.
- FIELD and divider IDs remain owned by the existing Construction topology.
- Reordering a Module does not change its ID or technical payload ownership.

## Free Constructor boundary

The free workspace is represented internally by an `entryMode: free` Offer-shaped ownership container only so every Module has an owner.

It is **not** a commercial offer and contains no pricing, approval, order or customer-document semantics.

Free Constructor -> Offer is an explicit human action. It creates a new Offer and a new Module ID. Construction and profile resolution are deep independent copies. The source Free module remains unchanged.

No UNKNOWN or UNCONFIRMED state is promoted during the copy.

## Persistence contract

- Snapshot schema: `project-foundation-01`.
- Persistence adapter: browser `localStorage`, isolated from domain code.
- Hydration is synchronous and completes before autosave effects can run.
- Valid snapshots are shape/ownership validated before use.
- Corrupt JSON and unsupported schema versions fail closed.
- A corrupt/unsupported stored record is never silently overwritten by an empty project.
- Storage failures keep the working snapshot in memory and are not presented as successful saves.
- Multiple local projects remain discoverable through the local project index.

## Persisted data

The canonical snapshot persists:

- Project ID and client/object metadata.
- Offer ownership and offer defaults/state required by the current workflow.
- Module stable IDs, sequence and module definitions.
- Construction drafts by stable Module ID.
- Module profile resolutions by stable Module ID.
- Minimal workspace navigation needed to reopen the working context.

Derived candidate lists and technical readiness read models are not persisted as a second source of truth.

## Preserved technical boundaries

PROJECT FOUNDATION 01 does **not** change the existing technical truth model:

- human glazing thickness remains explicit per FIELD;
- bead selection remains human-only;
- a single bead candidate is not auto-selected;
- base-profile compatibility remains UNCONFIRMED where evidence is missing;
- glazing inset remains UNKNOWN;
- glass cut remains UNKNOWN;
- Construction topology is unchanged;
- Guidance and Pan / Auto Fit remain UI behavior;
- MACHINE READY remains NO.

## Out of scope

Not implemented in this stage:

- revisions or immutable release snapshots;
- client/technical approvals;
- override/inheritance revision semantics;
- pricing;
- BOM or glass list;
- cut list or production operations;
- production release/lifecycle;
- machine adapters or machine export;
- AI direct editing;
- automatic technical resolution.

## Runtime acceptance

The runtime suite verifies at least:

1. Stable Project / Offer / Module IDs.
2. Module sequence is not identity.
3. Graph ownership and dangling reference rejection.
4. Snapshot serialize/deserialize round trip.
5. Metadata, topology, assignments, reinforcement and glazing restoration.
6. Module isolation and reorder safety.
7. Free -> Offer deep independent copy with a new Module ID.
8. Mutation of the copied Offer module does not mutate the original Free module, including after reload.
9. Existing system reconciliation on explicit Offer setup.
10. UNKNOWN / UNCONFIRMED preservation and no glazing auto-selection.
11. Hydration before autosave.
12. Corrupt JSON / future schema fail-closed behavior.
13. Storage read/write failure behavior.
14. Multiple local project discovery.
15. Actual React workspace hook hydration/autosave behavior.
16. Callback adapter module isolation through reload/reset.
17. Free -> Offer workflow survival through reload.
18. Save failure reporting without data loss.

## Final acceptance gate

Before marking PROJECT FOUNDATION 01 CLOSED, perform a human browser pass:

1. Create/edit a Free module.
2. Confirm local save status.
3. Reload and confirm the same stable module and technical state return.
4. Create an Offer from that Free module.
5. Confirm the Offer copy has a new Module ID.
6. Modify the Offer copy and confirm the Free source remains unchanged.
7. Reload again and confirm both states remain independent.
8. Confirm Guidance, Pan/Auto Fit and GLAZING CONTEXT 01B behavior remain unchanged.

No commit / no push is part of this acceptance stage.

# COMPOSITE MODULE GUARD 01D.2A — OCCUPIED MODULE PROTECTION

This stage prevents starting a new Composite Structure inside a Module that already contains a Constructor construction. It adds no sketch integration, conversion, destructive overwrite or topology replacement.

## Canonical occupied definition

`hasModuleConstructorConstruction(snapshot, moduleId)` requires a real module and a non-null `snapshot.constructionDraftsByModuleId[moduleId]`. This persisted project payload is the authority. It includes committed outer-frame-only drafts, legacy frame/divider drafts and current construction topology. A single committed outer frame is still real construction; the predicate does not require a divider or an opening.

Module existence, sequence/display name, profile system, form dimensions, profile assignments and view state do not make a module occupied. Constructor's `getInitialConstruction` can create a local seed from form dimensions, but opening/rendering it does not publish a construction draft. Actual construction actions publish through `broadcastConstruction` and `onDraftChange`. Thus an initial local seed with a null project payload is empty for this guard. A persisted draft is never guessed to be an empty seed based on its dimensions or appearance.

`needsCompositeModuleGuard` applies only when the above predicate is true **and** the module has no existing composite structure (absent/null). Existing project data is validated normally; these helpers do not introduce another persistence store.

## Entry behavior and dialog

- Empty module: open the existing module's Composite Structure editor directly. No dialog or new module.
- Occupied module without a composite: show a confirmation; do not mutate the project while proposing.
- Existing composite: open that same structure for editing, including historical Constructor + Composite coexistence. Do not migrate, split, move or delete historical content.

The dialog reuses the project manager's visual styles, with native modal focus handling and Escape cancellation:

> Модул N вече съдържа конструкция
>
> Този модул вече има създадена скица в Конструктора. За да я запазим, новата рамкова структура трябва да бъде в отделен модул.

Its only buttons are `Създай Модул X` and `Отказ`. Cancel, including Escape, changes only dialog state: no project edits, module creation, selection changes or storage writes. No destructive option exists.

## Creation, numbering and system defaults

The previous free/offer Add Module handlers each computed max sequence + 1. That same rule is now owned by `getNextModuleSequence(snapshot, offerId)`, scoped to the current offer/free workspace. Both normal Add Module and the confirmed guard action use `createNextProjectModule`, which delegates to the existing `replaceFreeModules` / `replaceOfferModules` and `createOfferModule` factory inside `editProject`.

Numbering uses actual current modules, not a UI counter or current module number + 1. Gaps/deletion follow the existing max + 1 policy: deleting the highest module can make its number available again. Stable IDs remain new and independent of display numbers. The confirmation proposal uses the same helper as creation, so its button number matches the created module.

The new module belongs to the same project and owner. Free creation inherits only the source's canonical `definition.profileSystemId`; offer creation uses normal current offer defaults to populate `definition.draft.inheritedDefaults`. If an offer's current defaults differ from an old module's inherited defaults, normal offer creation semantics prevail. No second system authority is introduced.

The new module has null construction payload, unset product type, clean profile resolution, and no composite structure. Offer module dimensions and fields start unset/empty through the existing factory. No construction, fields, dividers, frame parts, connections, opening state or model assignment is copied. The original module and its construction/profile payloads remain semantically unchanged.

## Confirmation and failure safety

`proposeCompositeModule` is read-only and allocates no ID. `createConfirmedCompositeModule` recomputes the proposal against current project state and requires the original module to remain active. Project/owner/source identity, source sequence, canonical systems and next sequence must still match, and the module must still need the guard. A removed source, changed active module, changed numbering/system, cleared construction or newly added composite rejects the stale request and asks the user to reopen the dialog.

The UI has an immediate confirmation latch. The workspace also updates its latest snapshot synchronously after a successful persisted creation. Replaying the previous confirmation therefore cannot create a second module because selection/numbering no longer matches. A failed attempt releases the latch for an explicit retry.

Confirmed creation uses `saveProjectSession` and normal `LocalProjectStorage`. Only after successful persistence does it publish the new snapshot, activate the new module and open the editor for its stable ID. Validation, creation or storage failure leaves the prior in-memory project and current module intact, keeps the dialog with an error and opens no hidden editor. The existing storage adapter's atomic record writes and navigation-pointer rollback are reused; there is no new transaction/storage system. Normal Add Module retains its existing workspace autosave lifecycle.

For a project that has never completed a save, confirmation first persists the original snapshot through the same adapter before saving the new-module snapshot. If the initial navigation-pointer write fails, only the original project can remain on disk; no hidden new module is written. The in-memory original remains intact and the dialog can be retried.

`saveModuleCompositeStructure` rechecks the same guard at Save. If a construction appeared after the editor opened, Save returns an error and preserves the draft and project. The user can use the existing `Структура на модула` entry to obtain the same explicit new-module confirmation. No content is automatically copied to that clean new module. Existing composites continue to use their normal stale-editor and system checks.

## Compatibility and boundaries

01D.1 schema v2, order, alignment and legacy v1 unresolved placement are unchanged. Historical coexistence stays loadable and editable. The Constructor renderer, ConstructionModel, topology and Model Library storage are unchanged.

- OCCUPIED MODULE OVERWRITE = BLOCKED
- NEW MODULE CREATION = USER CONFIRMED
- AUTOMATIC GEOMETRY = NO
- AUTOMATIC PLACEMENT = NO
- FRAME PART PLACEMENT = HUMAN DEFINED
- RULES VALIDATED = NO
- MACHINE READY = NO
- ZERO DIVIDER EXACT GEOMETRY = UNKNOWN
- FRAME-TO-FRAME COMPATIBILITY = HUMAN REVIEW
- EXACT CUT / OVERLAP / INSET = UNKNOWN

No Frame Part → FIELD mapping, ZERO_DIVIDER → Constructor divider mapping, automatic field generation, model assignment or sketch rendering is introduced.

## Automated verification

`scripts/verify-composite-module-guard01d2a.mjs` executes real predicates, creation operations, serialization, workspace persistence, App wiring, entry handlers and Constructor initial rendering. Its in-memory event harness does not simulate React effects, browser layout or native dialog focus; no application/browser is started.

Coverage includes empty/form-seed versus persisted construction, direct existing-composite editing, historical v1/v2 coexistence, Cancel/Escape with unchanged persistence, clean free/offer creation and activation, proposed/actual numbering, deleted modules, stale/repeated confirmation, failed storage, Save-time conflicts, original-module equivalence and protected source fingerprints. Stash preservation is checked separately with Git inspection, not mutated by a verifier.

The 01B source assertion follows the entry label into its extracted component. The 01C topology-preservation case now edits a pre-existing historical composite and asserts a real width change while preserving topology; NEW coexistence is explicitly rejected by the new verifier. No old topology-preservation or system/placement assertions are removed.

Run 01A, 01B, 01C, 01D.1 and 01D.2A verifiers explicitly, then lint, build and full `npm run verify`. Composite scripts are not included in the existing full verify command.

## One manual acceptance scenario

Open `Структура на модула` for Module 1 with real Constructor content and no composite. Expect `Модул 1 вече съдържа конструкция`, `Създай Модул N`, `Отказ`. Choose `Създай Модул N`. PASS: exactly one clean new module becomes active with its Composite Structure editor open; Module 1 remains unchanged.

# PROJECT FOUNDATION 02 — Revisions + Evidence + Human Confirmation

Status: implementation + audit hotfix candidate. No commit / no push.

## Scope

PROJECT FOUNDATION 02 extends the accepted PF01 canonical Project / Offer / Module graph with:

- one explicit immutable `ProjectRevision` chain;
- deterministic canonical fingerprints;
- a closed, versioned statement predicate registry;
- version-aware source/evidence records;
- explicit scoped human confirmations;
- monotonic dependency generations and freshness assessment;
- validated PF01 -> PF02 migration;
- a thin assurance UI for recording a revision and confirming an exact statement.

It does not add independent OfferRevision or ModuleRevision entities. Offer and Module revision views are selectors over a ProjectRevision.

## Preserved boundaries

The following remain unchanged in meaning:

- Construction topology, FIELD lineage and divider identity;
- `ModuleProfileResolution` as the technical assignment model;
- explicit per-FIELD human glazing thickness;
- human-only bead selection and no single-candidate auto-select;
- bead/base-profile compatibility remains UNCONFIRMED without an explicit reviewed rule;
- glazing inset remains UNKNOWN;
- glass cut remains UNKNOWN;
- Guidance 01 / 01.1;
- Pan / Auto Fit and VIEW 01 / 01.1;
- PF01 local persistence and hydration-before-autosave behavior.

Human input is not automatically a human confirmation. Human confirmation is not automatically technical proof. Confirmation never grants production or machine usage in PF02.

## Revision boundary

- Normal editing, autosave, navigation, Pan/Zoom and Undo/Redo create no recorded revisions.
- A revision is created only by the explicit record-revision operation.
- Recording unchanged recordable content is a no-op/reuse of the current head.
- Recorded content is detached from mutable draft state and fingerprinted canonically.
- Historical revisions are immutable application records; the fingerprint is an integrity mechanism, not a signature.

## Evidence and confirmation

- Statements use a closed PF02 predicate registry; unsupported predicate/value/unit/scope combinations fail closed.
- Sources and evidence records are content-addressed and immutable when retained as history.
- Confirmation binds actor, time, exact statement, exact recorded revision, supporting evidence and captured dependencies.
- Confirmation requests revalidate displayed content and dependencies immediately before acceptance.
- A later technical edit can make an earlier confirmation stale without rewriting the historical confirmation itself.
- Free -> Offer copying does not transfer human authority to the new module.

## Evidence retention audit hotfix

Ordinary draft editing originally retained every superseded evidence record, even when it was not referenced by a recorded revision or confirmation. A stress audit showed one module growing from 20 to 620 evidence records after 100 ordinary size edits, increasing the serialized snapshot from roughly 49 KB to roughly 576 KB.

PF02 now retains:

1. all current evidence records;
2. all evidence and recursive input evidence pinned by recorded revisions;
3. all evidence and recursive input evidence pinned by human confirmations;
4. all sources required by those retained evidence records and reviewed rules.

Superseded draft-only evidence is pruned. This is not deletion of historical authority because records referenced by revisions or confirmations remain immutable and preserved.

Audit stress verification after the hotfix: 100 equivalent unrecorded size edits keep the same 20 evidence records and a roughly stable serialized snapshot size.

## Persistence / migration

- PF01 data migrates deterministically to PF02.
- Migration creates zero recorded revisions and zero HumanConfirmation records.
- It invents no actor, confirmation time or external catalog edition.
- Existing `source: 'human'` remains legacy human-input provenance only.
- Corrupt or unsupported snapshots fail closed and are not silently replaced.
- Storage failures retain in-memory work and previous persisted history.
- There remains one active local project store; no second persistence source of truth is introduced.

## Acceptance verification

Required runtime acceptance:

- PF01 runtime regression: 27 cases PASS;
- PF02 runtime suite: 57 cases PASS after the evidence-retention audit case;
- canonical serialization / SHA-256 determinism;
- revision identity, explicit boundary and immutable isolation;
- exact statement keys and closed predicate validation;
- evidence traceability and version distinction;
- confirmation scope and confirmation race rejection;
- stale confirmation behavior, including Undo not resurrecting authority;
- module isolation and Free -> Offer authority isolation;
- conservative PF01 -> PF02 migration;
- serialize / deserialize round trip;
- fail-closed corrupt/future data behavior;
- bounded transient evidence retention while preserving pinned history.

The final workstation acceptance must also run the complete existing `npm run verify` suite, lint and production build, and manually exercise the browser flow:

`Record revision -> inspect exact statement -> explicit confirmation -> edit a dependency -> confirmation requires review`.

## Still explicitly out of scope

No production release, readiness engine, BOM, cut list, optimization, pricing, order workflow, machine export/readiness, AI direct editing/chat, catalog ingestion or OCR/import is introduced by PF02.

# COMPOSITE MODULE PLACEMENT 01D.1 — EXPLICIT ORDER + ALIGNMENT

01D.1 adds human-defined horizontal ordering and vertical alignment to the existing module-bound composite editor. It prepares data for the future 01D.2 structural sketch; it does not render or change a Constructor sketch.

## Domain representation

Composite structure schema v2 requires a placement object on each Frame Part:

```ts
placement: {
  order: number | null
  verticalAlignment: 'TOP' | 'BOTTOM' | null
}
```

`order` is a positive safe integer, unique among all non-null orders in the structure. It expresses relative horizontal order for any number of parts. Smaller order means before/to the left of larger order. Gaps are valid and remain unchanged on load, save and part deletion. Alignment can be TOP, BOTTOM or null; CENTER is unsupported. Either null field means placement is not fully resolved. Partial/unresolved data remains a valid draft and is explicitly identified in the editor summary.

The `frameParts` array is storage/identity presentation order. Its index never assigns placement. The editor's “Рамкова част 1” identifies a card; its separate “Позиция в модула” expresses position. The summary lists explicitly ordered parts by `placement.order`, followed by unplaced parts clearly labelled as unresolved. Neither summary order nor array order is persisted as geometry.

## Schema and legacy compatibility

- Schema v1 has no placement property and remains loadable. A placement property in v1 is rejected rather than silently accepted as a future extension.
- Schema v2 requires both placement keys; unsupported values, duplicate orders, unknown properties and future schema versions are rejected.
- `getFramePartPlacement` exposes legacy placement as `{ order: null, verticalAlignment: null }` without modifying the source.
- `upgradeCompositeModuleStructure` validates and creates a detached v2 copy with null placement for every v1 part. It copies all existing IDs, connections, dimensions, profiles, sides and FIELD reference arrays without reinterpretation.
- The editor uses that canonical upgrade when opening its draft. Its original saved baseline remains v1 for the existing stale-write check. Cancel discards the upgraded draft; Save stores v2 through the existing module/project flow.
- Project deserialization does not migrate or rewrite v1 structures. Existing saved projects, dependency digests and immutable revisions remain unchanged. A new revision may contain v2 beside preserved v1 history. The project remains PF02; PF01 project validation remains strict.

OLD: placement unknown. NEW: placement explicit only where the human selected it. Neither loading nor migration derives order from array index, function, dimensions or connections.

## UI actions

New parts use option B: order and alignment both start unresolved. “Добави рамкова част” assigns neither. The user can choose:

- “Постави първа” when no other part is placed;
- “Преди Рамкова част …” or “След подредените части” to insert a part;
- “Наляво” / “Надясно” to move a placed part one position among explicitly placed parts;
- “Не е определена” to clear the target order without renumbering peers;
- “Горе” / “Долу” / “Не е определено” for independent vertical alignment.

Insertion and movement are explicit user actions. They deterministically renumber only the placed participants and the target to 1…N. Other unresolved parts stay unresolved. Buttons at the ends, and movement buttons for unplaced parts, are disabled. Storage array order stays unchanged. There is no raw number input, drag-and-drop, automatic placement, coordinate calculation or dimension calculation.

Reordering changes only order. It preserves IDs, function, alignment, dimensions, profile, frame sides and all connections. Changing function or frame sides preserves placement; changing alignment preserves order, function and sides. An open-bottom door remains valid, as does a closed-bottom door.

## Ownership, persistence and relationships

Placement belongs to the Frame Part in the concrete Module's composite structure. Save validates and writes through `saveModuleCompositeStructure` and normal project storage. Cancel does not write. Failed storage leaves the draft open and the saved in-memory project unchanged. Module A and Module B remain independent. Placement changes participate in the existing module change digest, without adding human confirmations or technical validation.

System authority remains free `definition.profileSystemId` or offer `definition.draft.inheritedDefaults.profileSystemId`. Placement has no system authority of its own.

ZERO_DIVIDER is independent of placement. Adjacent orders do not create a connection. Reordering never creates or removes one. It stays a structural relationship between stable Frame Part IDs, with no physical profile or exact joint geometry.

## Future sketch and boundaries

01D.2 can use explicit order and alignment to interpret Window 1500×1500 before Door 700×2000, both TOP aligned. This stage stores the selections only. Unresolved placement must not be treated as a resolved layout by a future consumer.

No x/y coordinates, offsets, total dimensions, joint widths, cuts, deductions, overlaps, insets, manufacturing geometry, FIELD mapping or Model assignment are introduced. ConstructionModel, divider topology, Constructor sketch and Model Library persistence are unchanged.

- AUTOMATIC GEOMETRY = NO
- AUTOMATIC PLACEMENT = NO
- FRAME PART PLACEMENT = HUMAN DEFINED
- RULES VALIDATED = NO
- MACHINE READY = NO
- ZERO DIVIDER EXACT GEOMETRY = UNKNOWN
- FRAME-TO-FRAME COMPATIBILITY = HUMAN REVIEW
- EXACT CUT / OVERLAP / INSET = UNKNOWN

## Automated acceptance

Run the four composite verifiers explicitly (they are not included in the existing full verify command):

```text
node scripts/verify-composite-module-structure01a.mjs
node scripts/verify-composite-module-structure01b.mjs
node scripts/verify-composite-module-integration01c.mjs
node scripts/verify-composite-module-placement01d1.mjs
npm run lint
npm run build
npm run verify
```

01D.1 tests real domain validation/migration, reorder helpers, project operations, serialization, revision operations and LocalProjectStorage with in-memory storage. A panel/workspace event harness covers legacy Cancel, Save/reload, subsequent placement Cancel, function/side independence and storage failure. It does not emulate React effects, DOM layout or browser interaction. Source fingerprints supplement runtime comparisons for protected topology and Model Library storage.

The 01A and 01C current-schema fixtures now include explicit null placement and expect version 2. Existing behavioral assertions remain. The former 01B whole-domain hash is replaced by 01A/01D.1 behavioral/schema coverage because the domain is intentionally extended; unchanged storage hashes and all safety assertions remain.

## One manual acceptance test

Open Module 1. Set Window 1500×1500 to first position (“Постави първа”) and “Горе”; set Door 700×2000 after it (“След подредените части”) and “Горе”. Save, leave, reopen the same Module. PASS: Window retains order 1, Door order 2, and both retain TOP alignment. No application or browser acceptance is run by the agent.

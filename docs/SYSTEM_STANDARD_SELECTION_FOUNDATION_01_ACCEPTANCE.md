# System Standard Selection Foundation 01

## Added

FacadeFlow now contains a source-linked PRELUDE 60/KMG list of the 17 requested KMG 3K and KMG 4K standards. The records retain the literal Bulgarian standard names, raw D0B0/D4B0 values where captured, component codes, evidence kinds, evidence locations, and unresolved conflicts. The records live in `src/data/profileSystems/systemStandards.ts`; they do not participate in component compatibility, geometry, assembly, cutting, or machine logic.

The Constructor shows a compact **РЎРёСЃС‚РµРјРµРЅ РІР°СЂРёР°РЅС‚** selector only when PRELUDE 60 is selected. It starts at **РР·Р±РµСЂРё РІР°СЂРёР°РЅС‚** and keeps the selection in transient UI state. The chosen record places directly associated profile candidates first in the existing manual selectors and marks them **РџСЂРµРїРѕСЂСЉС‡Р°РЅРѕ РѕС‚ СЃРёСЃС‚РµРјРЅРёСЏ РІР°СЂРёР°РЅС‚**. Other PRELUDE 60 candidates remain available.

Each displayed association identifies its source as an Altest `standart` record and the corresponding comment, D0B0, D6 role block, or formula reference. 482.22 is explicitly shown only as a 32 mm formula reference; the UI says its compatibility with the selected sash is unconfirmed. E3308 is shown as a D0B0 threshold association, without assigning a physical side from the token position.

## Source basis and supported records

The associations encode the completed read-only legacy extraction, KMG standard block decoding, Cyrillic recovery, and standard family semantics findings. They include KMG 3K/4K base standards, balcony T/Z standards, door T/Z threshold and closed-frame standards, frame-from-mullion/frame-from-sash standards, the 482.01 bead variant, and the budget variant.

Direct evidence distinctions are retained: balcony Tв†’482.23, balcony Zв†’482.25, door Tв†’482.27 via `DoorOut`, door Zв†’482.26 via `Door`, and E3308 through D0B0 threshold records. The names T/Z are preserved as source labels; no inward/outward geometry is inferred.

## Suggestions and conflicts

Suggestions are not compatibility, automatic selection, or proof of physical assembly. Selecting a standard changes only the transient suggestion context. It does not assign a frame, sash, bead, reinforcement, or threshold, and it does not change drawing geometry.

The unresolved conflict register preserves AP3173/AP3174 evidence, 482.30/482.30-K distinction, the KMG 4K T closed-frame 482.26 comment versus 482.27 `DoorOut` block, the 482.27 naming/`DoorOut` variable discrepancy, E3308 versus `alprag=0`, KM530 occurrences outside threshold-only contexts, and TRE 03 PDF/database thickness variants. Conflicts remain visible in the records and are not reconciled.

## What remains unknown

- D0B0 token positions are not mapped to physical sides; D4B0 meaning is unknown.
- 482.30 and 482.30-K equivalence is unresolved.
- Formula references do not establish bead-to-sash compatibility.
- Reinforcement choice, threshold geometry, open-frame construction, overlap/rebate, cut sizes, and opening-direction assembly remain unresolved.
- The budget standard has no component suggestions where a direct source association was not established.

## Boundaries and persistence

No project/module field was added. Standard choice is not serialized and does not affect existing project loading. No geometry, topology, rendering, opening symbols, Undo/Redo, assembly rules, or machine/production readiness were changed by this package.

**AUTOMATIC GEOMETRY = NO**
**RULES VALIDATED = NO**
**MACHINE READY = NO**

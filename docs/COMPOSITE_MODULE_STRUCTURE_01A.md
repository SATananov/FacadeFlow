# COMPOSITE MODULE STRUCTURE 01A — domain only

A Module has exactly one profile system and may contain one or more separate
Frame Parts. It is not necessarily a single shared frame. This additive domain
structure is not yet attached to ProjectModule, Constructor or persistence.

## Data

`CompositeModuleStructure` holds schema version 1, `systemId`, `frameParts` and
`connections`. It has no calculated overall dimensions or layout.

`CompositeFramePart` holds a caller-supplied stable `id`, `function`, explicit
positive finite `widthMm`/`heightMm`, nullable `frameProfileCode`, `frameSides`
and `fieldIds`. Different parts may have different sizes and frame profiles.
IDs are preserved; the factory does not generate or renumber them.

`CompositeFramePartFunction` reuses `ModuleProductType`: `window`, `door`, or
`null` (unset). `FrameSides` uses the existing `Side` type with four required
booleans: `top`, `right`, `bottom`, `left`. Type-only imports do not load the
Constructor, module or assembly engines.

`fieldIds` contains only references typed from `ConstructionFieldDefinition`.
No FIELD geometry or second construction tree is stored. An ID may appear only
once across the structure, including within a single part. Empty references are
allowed. Existence/resolution in an actual Constructor context is deferred to
future integration; structural validity does not claim those fields exist.

## Explicit frame sides

| Example | Function | Size, mm | top | right | bottom | left |
|---|---|---|---|---|---|---|
| Closed window | `window` | 1500 × 1500 | true | true | true | true |
| Entrance door without bottom frame | `door` | 700 × 2000 | true | true | false | true |
| Door with bottom frame | `door` | 700 × 2000 | true | true | true | true |

DOOR does **not** imply an open bottom. WINDOW does **not** imply a closed frame.
Every side is explicit input; no function-based topology defaults or engineering
rules are applied. Structurally accepted side combinations are not a statement
that a physical product is complete, compatible or manufacturable.

## Window + door composite

Within `kmg-prelude-60`, part A may be a 1500 × 1500 window with catalogue frame
`482.30`, while part B is a 700 × 2000 door with catalogue frame `482.20` and
`bottom: false`. Both codes have the catalogue role `frame` in that system.

`FramePartConnection` stores a stable ID, `fromFramePartId`, `toFramePartId` and
`kind: 'ZERO_DIVIDER'`. Connecting A to B is structurally valid. ZERO_DIVIDER is
an undirected relationship between separate frames, **not an internal divider
or mullion profile**, nor a claim of zero physical gap or deduction. The naming
of the endpoints introduces no placement or orientation. Exact joint geometry
and frame-to-frame compatibility require separate human review.

## Validation and API

- `validateCompositeModuleStructure(unknown)` throws for invalid structural
  data; it neither mutates input nor repairs missing values.
- `createCompositeModuleStructure(input)` validates, adds the schema version
  and copies nested data while preserving explicit IDs, dimensions and sides.
- The system must exist even when all frame profiles are unassigned. Only the
  module has a system ID; per-part system overrides are rejected. Each assigned
  frame code must exist in that system's main catalogue with role `frame`.
- At least one part is required. Part IDs and connection IDs are unique in
  their respective collections. References must be nonempty strings without
  surrounding whitespace. Dimensions must be finite numbers greater than zero.
- All four sides must be explicit booleans; `function` and `frameProfileCode`
  use explicit null for unset values. Duplicate/ambiguous FIELD IDs are rejected.
- Connection endpoints must exist, must differ, and must identify frame parts.
  Duplicate connections, including reversed endpoints, are rejected. A single
  part or several parts without connections are allowed; connectivity is not
  inferred or imposed as an engineering rule.
- Unknown schema versions, malformed values and extra properties are rejected.
  This prevents undeclared system overrides, embedded geometry or model IDs
  from silently entering this foundation.

## Deliberately deferred

No UI, Saved Model assignment, placement engine, total module sizing, profile
compatibility rules, production geometry, connector dimensions, reinforcement
rules, overlap/inset/cut calculations, project migration or persistence changes.
Existing topology, assignments, drawing/rendering, glazing and assembly logic
remain untouched. Future Model Assignment can reference each stable part ID
without replacing the part structure.

Run the standalone verifier, lint and build without launching the application:

```
node scripts/verify-composite-module-structure01a.mjs
npm run lint
npm run build
```

The verifier covers scenarios A–K, additional malformed inputs, explicit topology,
reference ownership, catalogue roles, deterministic copying and absence of
runtime dependencies on geometry engines. It uses the existing in-memory TypeScript
loader; no app, server or browser is started. No package script is changed.

```
AUTOMATIC GEOMETRY = NO
RULES VALIDATED = NO
MACHINE READY = NO
ZERO DIVIDER EXACT GEOMETRY = UNKNOWN
FRAME-TO-FRAME COMPATIBILITY = HUMAN REVIEW
EXACT CUT / OVERLAP / INSET = UNKNOWN
```

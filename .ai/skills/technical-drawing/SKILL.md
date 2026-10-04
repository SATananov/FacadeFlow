# Technical Drawing Knowledge Skill

## Purpose

Use this skill when specifying, implementing, or reviewing FacadeFlow technical sketches for windows, doors, terrace/balcony doors, combined door-and-window modules, opening symbols, dimensions, functional-region presentation, or ZERO_DIVIDER.

This skill preserves approved visual and semantic conventions. It does not define production geometry, catalogue compatibility, manufacturing readiness, or rules validation.

## Required safety boundaries

AUTOMATIC GEOMETRY = NO
RULES VALIDATED = NO
MACHINE READY = NO
UNKNOWN FACTS MUST REMAIN UNKNOWN

Never turn an approximate drawing or visual reference into an authoritative production dimension. Never infer profile dimensions, catalogue compatibility, sash overlap, threshold geometry, physical ZERO_DIVIDER width, or unspecified opening handing.

## Required reading by topic

- Evidence classes and reference use: [REFERENCE_EVIDENCE_RULES.md](REFERENCE_EVIDENCE_RULES.md)
- Windows: [WINDOW_RULES.md](WINDOW_RULES.md)
- Doors: [DOOR_RULES.md](DOOR_RULES.md)
- Combined door + window: [COMBINED_DOOR_WINDOW_RULES.md](COMBINED_DOOR_WINDOW_RULES.md)
- Opening symbols: [OPENING_SYMBOL_RULES.md](OPENING_SYMBOL_RULES.md)
- Dimension presentation: [DIMENSION_RULES.md](DIMENSION_RULES.md)

## How to use

1. Classify each conclusion as VERIFIED, HUMAN-APPROVED VISUAL RULE, HUMAN-APPROVED SEMANTIC RULE, LIKELY, ASSUMED, or UNKNOWN.
2. Use only VERIFIED or explicitly human-approved visual/semantic rules to guide implementation, and only within their stated scope.
3. Keep visual appearance, functional-region role, field type, opening mode/handing, and catalogue facts as separate concepts.
4. If a requested drawing depends on an unknown production fact, preserve the unknown and fail closed rather than inventing it.
5. Consult the Technical Drawing Specialist for drawing-specific advice. Keep one primary implementation owner; the specialist does not silently own unrelated domain work.
6. Require human visual acceptance for visual drawing changes. The specialist cannot declare MACHINE READY.

## Reference storage

Human reference descriptors and future attachment instructions are indexed in [`docs/technical-drawing-reference/README.md`](../../../docs/technical-drawing-reference/README.md). No screenshot is presumed to be present unless an actual repository file is identified there.

# DOOR LEAF / P-FRAME VISUAL SEMANTICS 01

Door sketch presentation reuses the existing module type and bottom frame edge state.
No domain model, serialization, opening semantics, topology, field/module identity,
ZERO_DIVIDER, history, catalogue or readiness logic changes.

## Scope and results

- Bottom-reaching rectangular operable fields in door modules receive leaf styling.
  Fixed sidelights and upper transoms retain their existing appearance. Multiple
  bottom-reaching operables can represent double leaves; no primary identity is invented.
- The opaque leaf band paints in front of frame/divider faces. The non-interactive
  perimeter overlay shares the leaf bounds. Existing input targets remain intact.
- Full frame retains its bottom PVC member; the leaf band partially occludes it.
- Open frame retains left/top/right members, omits bottom PVC, and leaves visible
  schematic space above a dashed sketch reference. This is not a finished-floor datum.
- Threshold is a separate hatched lower placeholder, still labelled as having no
  selected profile. The leaf ends above it. No automatic E3308 assignment occurs.
- All new offsets are display pixels, independent of zoom and catalogue millimetres.
  The bottom-spacing tooltip explicitly says schematic, without a physical dimension.
  Field dimension annotations retain topology dimensions and sit outside door marks.
- Window and terrace-door sash rendering is unchanged. Their existing module labels
  distinguish intent; terrace-door retains its relationship note and window-like sash.
- Opening SVG coordinates and mode/handing conditions remain unchanged. Handle
  position remains the existing known-data-only cue; no new ergonomic height is claimed.

## Evidence and unresolved scope

The [door evidence foundation](PRELUDE_60_DOOR_EVIDENCE_FOUNDATION_01_ACCEPTANCE.md)
is context only. Its companion is not imported by rendering. No legacy expressions
are evaluated. Exact bottom clearance, assembled overlap, threshold elevation,
P-frame construction/serialization rules and production readiness remain UNKNOWN.
Polygonal door leaves retain existing rendering; no polygon leaf geometry is inferred.
There is no user-entered technical bottom-clearance field consumed by this package.

## Verification

Run `node scripts/verify-door-leaf-p-frame-visual01.mjs`. It renders the real
Constructor with deterministic hooks for door/window/terrace/unset types and all
bottom states, checks a sidelight/transom/leaf topology, verifies no state mutation,
and compares all opening-mode/handing SVG signatures with window rendering.
Static checks guard pixel-only styling, non-import of evidence and safety boundaries.
Browser QA supplements this with actual CSS/layout inspection; static checks alone
do not prove visual appearance.

DOMAIN MODEL CHANGED = NO

SERIALIZATION CHANGED = NO

AUTOMATIC GEOMETRY = NO

RULES VALIDATED = NO

MACHINE READY = NO

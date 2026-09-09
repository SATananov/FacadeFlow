# PROFILE RESOLUTION 01A — Human Profile Assignment Foundation

## Goal

Introduce the first real Profile Resolution layer after Constructor 01D.3.1.
The layer connects confirmed Constructor structure to real catalogue profile codes
without mixing profile assignments into `ConstructionModel` and without changing
schematic Constructor geometry.

## Accepted behaviour

- The selected offer profile system is the only catalogue source used for candidates.
- The frame can be assigned only a catalogue profile with role `frame`.
- Every normal or angled divider can be assigned only a catalogue profile with role `mullion`.
- An operable window FIELD can be assigned only a `sash` profile.
- An operable door FIELD can be assigned only a `door-sash` profile.
- A FIX FIELD does not require a sash profile.
- A FIELD with unset type does not receive a sash profile candidate list.
- Concrete profile codes are selected by the human. No automatic candidate is chosen.
- Every assignment records `source: human`.
- Assignments are persisted per offer module and survive switching between modules.
- Deleted dividers/FIELDs and FIELD type changes remove stale incompatible assignments.
- Profile assignments are stored outside canonical construction topology.

## Safety / architecture boundary

- `ConstructionModel` remains the source of truth for topology and schematic geometry.
- Profile Resolution 01A does **not** interpret raw catalogue `calloutsMm`.
- Frame face remains schematic 60 mm in this stage.
- Divider face remains schematic 40 mm in this stage.
- Selecting a real profile code does not yet resize frame/divider/sash geometry.
- No reinforcement, glazing bead, hardware, cut list, machining, or machine output is resolved.

## UI

In offer Constructor mode, the properties panel exposes human profile assignment for:

1. selected frame,
2. selected divider / angled divider,
3. selected operable FIELD.

The UI also shows Profile Resolution progress for the active module and clearly labels
geometry as unchanged until the later semantic-dimensions/profile-aware geometry stage.

## Stage boundary

PROFILE CODE RESOLUTION: HUMAN-ASSIGNED FOUNDATION
RAW CATALOG CALLOUT SEMANTICS: NO
PROFILE-AWARE GEOMETRY: NO
REINFORCEMENT RESOLUTION: NO
HARDWARE RESOLUTION: NO
MACHINE READY: NO

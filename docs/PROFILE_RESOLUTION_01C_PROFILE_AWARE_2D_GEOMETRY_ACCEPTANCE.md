# PROFILE RESOLUTION 01C — Profile-aware 2D Geometry Foundation

## Intent

Introduce a reviewed 2D geometry layer without changing canonical Construction topology.
The Constructor may visually distinguish a profile face only when that face has an explicit
human-confirmed dimensional meaning. Raw catalogue callout positions are never interpreted as geometry.

## Accepted behavior

- `Profile View` is available only when the module is attached to a real profile system and a frame exists.
- Construction topology remains authoritative for FIELD bounds, divider positions, drag behavior, Undo/Redo and module persistence.
- `482.30` may render a reviewed frame visible-face overlay of **42 mm** because that meaning is human-confirmed in Profile Resolution 01B.
- `482.21` may render a reviewed mullion visible-face overlay of **40 mm** because that meaning is human-confirmed in Profile Resolution 01B.
- A selected profile whose visible face is still `UNKNOWN` remains schematic; 01C does not derive a face from `calloutsMm`.
- Operable FIELD sash geometry remains schematic until **visible sash face + sash overlap + glazing inset** are all human-confirmed.
- With current PRELUDE 60 reviewed data, sash profiles such as `482.18` therefore remain `SASH GEOMETRY · UNKNOWN`.
- FIX glazing, visible glazing and glass-cut geometry are not invented in this stage.
- Angled-divider profile-aware face reconstruction is not introduced by this stage; canonical angled topology remains unchanged.
- Profile View technical status stays outside the drawing surface; the canvas is reserved for geometry and dimensions.
- Turning `Profile View` off returns to the unchanged schematic rendering.

## Safety boundary

- CONSTRUCTION TOPOLOGY: UNCHANGED
- FIELD BOUNDS: UNCHANGED
- DIVIDER POSITIONS / DRAG: UNCHANGED
- RAW CATALOG POSITIONAL INFERENCE: NO
- SASH OVERLAP INFERENCE: NO
- GLAZING / GLASS-CUT GEOMETRY: NO
- PROFILE-AWARE 2D GEOMETRY: PARTIAL REVIEWED OVERLAY ONLY
- MACHINE READY: NO

# CONSTRUCTOR 01E — TECHNICAL DRAWING CLARITY ACCEPTANCE

Scope: UI-only readability pass over the existing Constructor drawing surface.

## Goal
Bring the central drawing experience closer to the way an experienced production operator reads a technical sketch:
- lighter and cleaner drawing canvas;
- more discreet grid and rulers;
- flatter and clearer frame / sash / divider rendering;
- stronger opening symbols;
- key FIELD information readable directly inside the sketch;
- more space preserved for the drawing itself.

## Must hold
- Geometry, topology and FIELD semantics are unchanged.
- Profile Resolution 02A / 02A.2 / 02A.3 behavior is unchanged.
- No BOM / cut list / machine output logic is introduced.
- No automatic profile-aware geometry inference is introduced.
- This step only improves technical readability and operator confidence.

## Visual expectations
- The canvas background reads more like a white technical sheet.
- Grid lines remain available but should not overpower the drawing.
- The frame and dividers read as flatter technical components, not glossy UI blocks.
- Operable wings must remain visually obvious.
- When a FIELD is large enough, it shows an in-sketch technical card with:
  - FIELD number;
  - FIELD size;
  - FIX / SASH role label;
  - glazing thickness when available;
  - opening direction label when available.
- When a FIELD is too small, the minimal circular number badge remains.
- The bottom FIELD strip remains available but uses less height so the sketch area stays dominant.

## Safety boundary
- MACHINE READY: NO
- BOM / CUT LIST / MACHINE: NO
- PROFILE-AWARE GEOMETRY: NO

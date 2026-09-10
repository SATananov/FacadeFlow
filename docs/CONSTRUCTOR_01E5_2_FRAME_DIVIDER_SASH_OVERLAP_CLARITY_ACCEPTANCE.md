# CONSTRUCTOR 01E.5.2 — FRAME / DIVIDER / SASH OVERLAP CLARITY

## Purpose
Improve technical drawing readability so the assembly hierarchy is visible at a glance, using the supplied SkyGlazing drawing only as a visual reference for clarity.

## Visual contract
- The outer frame reads in front of divider endpoints.
- Divider faces remain visible inside the frame opening and terminate visually under the outer frame bars.
- OPERABLE fields show a compact sash profile ring close to the field/frame/divider boundary.
- The sash ring uses a fixed screen-space schematic band, not a percentage of FIELD width.
- 45-degree sash joint lines remain only inside the sash profile band.
- Opening symbols start/end on the inner sash contour.
- Selecting the frame must not redraw it with a large cyan outline.
- FIX fields do not receive a sash ring.

## Technical boundary
This stage is visual / schematic only.
It does not claim a catalog sash face, overlap, rebate, cut length, or machine geometry.
No unknown profile dimension is converted into millimetres.

Geometry / topology / FIELD semantics: unchanged.
Profile Resolution 02A / 02A.2 / 02A.3: unchanged.
BOM / cut list / machine: NO.
MACHINE READY: NO.

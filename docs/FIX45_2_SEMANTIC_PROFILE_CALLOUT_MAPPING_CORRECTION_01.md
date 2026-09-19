# FIX45.2 — Semantic profile callout mapping correction

FIX45.1 incorrectly swapped the semantic anchor boxes after interpreting screen-left /
screen-right position from a rotated node.

FIX45.2 restores the semantic mapping:

- support profile code -> support graphic -> supportBox
- sash profile code -> sash graphic -> sashBox

For the reviewed PRELUDE 60 node:
- 482.21 is the mullion / divider profile, catalogue envelope 60 x 84 mm
- 482.05 is the sash profile, catalogue envelope 60 x 56 mm

Screen-left / screen-right position is orientation-dependent and must never be used to
reassign profile identity.

No geometry, dimensions, coordinates, overlap or production rules are changed.

# COMPOSITE TECHNICAL SKETCH 01D.2C

## Goal

Turn the already accepted 01D.2B composite structural projection into a clearer technical sketch without promoting presentation geometry into engineering geometry.

## Visual contract

- Each explicit `frameSides` side renders as a visible frame/case band instead of a single hairline.
- Missing sides remain missing. A door with `bottom=false` stays open at the bottom.
- The selected frame profile code is shown as identity text only.
- The frame-band width is presentation-only, canvas-scaled and clamped. It is **not** a production profile face dimension.
- Width annotations are view-only labels.
- An explicit `ZERO_DIVIDER` remains a relationship marker, not a physical divider profile.
- If a door participates in a horizontal connection, the ZERO_DIVIDER marker is anchored to the contacting side of the door. In the acceptance case `window -> door`, it is anchored to the **left side of the door**.
- No connection is inferred from adjacency.

## Acceptance scenario

Composite-only Module 3:

- Window: 1500 × 1500, order 1, TOP, all four frame sides, frame profile 482.30.
- Door: 700 × 2000, order 2, TOP, bottom=false, frame profile 482.20.
- Explicit ZERO_DIVIDER between the two parts.

Expected canvas:

- window left, door right;
- common top alignment;
- visible frame/case bands;
- no bottom frame band on the door;
- profile identities visible;
- ZERO_DIVIDER marker attached to the **left door side**, spanning only the vertical overlap with its neighbour;
- existing grid / zoom / pan / fit continue to work;
- no single invented outer frame around both parts.

## Safety boundary

```
STRUCTURAL SKETCH PROJECTION = VIEW ONLY
FRAME BAND WIDTH = PRESENTATION ONLY
ZERO DIVIDER = EXPLICIT RELATIONSHIP MARKER, NOT PHYSICAL PROFILE
AUTOMATIC GEOMETRY = NO
AUTOMATIC PLACEMENT = NO
FRAME PART PLACEMENT = HUMAN DEFINED
RULES VALIDATED = NO
MACHINE READY = NO
ZERO DIVIDER EXACT GEOMETRY = UNKNOWN
FRAME-TO-FRAME COMPATIBILITY = HUMAN REVIEW
EXACT CUT / OVERLAP / INSET = UNKNOWN
```

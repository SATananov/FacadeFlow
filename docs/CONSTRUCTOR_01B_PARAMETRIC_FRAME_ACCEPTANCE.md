# Constructor 01B — Parametric Frame Acceptance

## Scope

Constructor 01B turns the Constructor shell into the first genuinely editable CAD-like scene.

## Accepted behavior

- Free Constructor can start without client, object, offer, profile system, color, glazing, or hardware.
- `Каса / рамка` is an active tool.
- A frame can be created by pointer drag on the Constructor canvas.
- The frame stores semantic dimensions in millimetres rather than only painted pixels.
- The frame width and height can be edited numerically by typing exact millimetre values.
- Numeric fields allow normal intermediate typing (including clearing/replacing the current value) and commit on Enter or blur; Escape cancels the draft.
- Focusing a numeric dimension selects the current value so a new exact dimension can replace it immediately.
- Left, right, top, and bottom frame edges are selectable resize handles.
- Pointer resize updates width/height live.
- Snap uses a 10 mm working step when enabled.
- The status bar shows live pointer X/Y coordinates.
- Width and height dimension annotations are rendered next to the frame.
- The frame has conceptual visible thickness so the sketch reads like a window/door construction instead of a single rectangle line.
- The conceptual thickness is NOT a PRELUDE profile dimension and is not production semantics.
- Free-sketch frame geometry survives the route `Free Constructor -> Create offer -> Back to sketch`.
- When an offer is created from a free sketch, the free-sketch frame width and height seed Module 1 as manual dimensions.
- In offer mode, Constructor frame resize writes the edited width and height back to Module 1.
- Offer-level system/color/foil/glazing/hardware remain locked in offer mode.

## Explicit boundaries

- No vertical or horizontal dividers yet.
- No automatic fields or sash geometry yet.
- No profile code is inferred in free mode.
- No PRELUDE visible-width/depth production semantics are inferred in 01B.
- No cutting dimensions, optimization, machine instructions, or machine-ready output.

## Result

PARAMETRIC FRAME: YES
MOUSE FRAME CREATE: YES
EDGE RESIZE: YES
LIVE DIMENSIONS: YES
KEYBOARD DIMENSION EDIT: YES — TYPE + ENTER/BLUR, ESC CANCEL
SNAP: 10 MM WORKING STEP
FREE SKETCH -> OFFER DIMENSION TRANSFER: YES
DIVIDERS: NO — Constructor 01C
AUTOMATIC PROFILE SELECTION: NO
AUTOMATIC PRODUCTION GEOMETRY: NO
MACHINE READY: NO

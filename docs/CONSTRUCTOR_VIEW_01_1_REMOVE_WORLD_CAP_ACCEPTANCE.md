# CONSTRUCTOR VIEW 01.1 - Remove legacy 5000 mm world cap

## Problem
Direct frame resize used a legacy `MAX_WORLD_MM = 5000` canvas coordinate cap.
If a frame began at X=480 mm, its right-edge drag could not exceed 4520 mm width.
The same artificial ceiling affected bottom-edge height resize.

## Acceptance
- Pointer/world coordinates are non-negative but no longer capped at 5000 mm.
- Right-edge width resize has no artificial 5000 mm upper bound.
- Bottom-edge height resize has no artificial 5000 mm upper bound.
- Existing minimum construction dimensions remain enforced.
- Numeric dimension entry remains unchanged.
- Auto Fit / manual Fit remain unchanged.
- Construction topology is unchanged.
- No commit / no push.

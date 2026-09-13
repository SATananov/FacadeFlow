# CONSTRUCTOR VIEW 01 — Pan + Auto Fit to View

## Goal
Make the complete constructor product easy to position and keep fully visible in the canvas without changing construction geometry.

## Accepted behavior
- **Panorama / Pan** drags the viewport, so the complete product moves visually as one unit.
- Pan does **not** rewrite frame coordinates, FIELD topology, dividers, profile assignments, glazing data, or saved manufacturing semantics.
- **Fit AUTO** is enabled by default and centers/scales the complete frame inside the currently available canvas.
- Fit accounts for the outer dimension chains on the right and bottom so they remain visible.
- Frame creation, completed frame resize, numeric outer-size changes, module changes, and browser resize are re-fitted while auto-fit is enabled.
- Manual Pan or manual +/- zoom turns auto-fit off, preserving the user's chosen camera view.
- Pressing **Fit** restores centering and re-enables auto-fit.
- Manual zoom is anchored around the canvas center instead of jumping around the world origin.
- Grid and rulers follow the viewport offset.

## Technical boundary
- Construction topology: **UNCHANGED**
- Product dimensions: **UNCHANGED by Pan/Fit**
- Profile / glazing / bead auto-selection: **NO**
- Glazing inset: **UNKNOWN**
- Glass cut: **UNKNOWN**
- Machine ready: **NO**

## Human verify
1. Open a module containing a complete product.
2. Confirm it is automatically centered and fully visible after load.
3. Select **Panorama** and drag from both empty canvas and over the product; the complete product must move together.
4. Confirm dimensions/topology do not change while panning.
5. Use +/- zoom and confirm the view remains centered around the working area.
6. Press **Fit** and confirm the product returns centered and fully visible.
7. Resize the browser while Fit AUTO is active and confirm the product re-fits.

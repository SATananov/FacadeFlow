# Door View Orientation 01

## Behavior

Door modules have a transient **Гледка** control with **Отвън** and **Отвътре** choices. It begins unset; neither option is active and the drawing remains in its current canonical orientation until the user chooses. Outside uses that same orientation. Inside mirrors the construction drawing horizontally. Changing active module or module product type clears the view choice.

The view state is held only in `ConstructorShell`. It is not part of project/module data, serialization, construction history, profile assignments, or Undo/Redo. Toggling it does not mutate the construction or opening mode/handing.

## Rendering and interaction

Only the dedicated drawing layer is transformed. Rulers and workspace grid remain outside it. Field numbers, field dimension labels, the threshold label, and the open-bottom frame note are kept upright. Field dimension annotations remain with their visual fields; bay dimension spans are repositioned to the mirrored span without changing the displayed value. Overall dimensions remain outside the transform and unchanged.

Pointer coordinates are converted to frame-local coordinates and then inverse-mapped with `canonicalX = frameWidth - displayedX` for Inside view. This supports field-tool coordinate operations, divider dragging, angled-divider movement/endpoints, and frame-edge resizing. Visible left/right resize controls map back to canonical edges; stored frame geometry is not swapped.

Opening symbols mirror as drawing graphics while `openingMode` and `openingHanding` stay unchanged. Outside retains the existing frame stacking context at z-index 8. Inside removes that parent stacking level and raises only frame-edge and mitre visuals to z-index 11, above the door field (z-index 9) and sash-priority overlay (z-index 10). The threshold placeholder remains at its existing z-index 3 within the frame visual, below the leaf; no threshold layering rule is added. Returning Outside restores the original canonical presentation.

## Bottom states and limits

Full-frame doors retain the bottom frame member. P-frame doors retain the open-bottom representation and its readable label. Threshold doors retain the existing threshold placeholder and schematic spacing; no threshold/profile relationship, depth, overlap, floor datum, or physical dimension is introduced.

**AUTOMATIC GEOMETRY = NO**  
**RULES VALIDATED = NO**  
**MACHINE READY = NO**

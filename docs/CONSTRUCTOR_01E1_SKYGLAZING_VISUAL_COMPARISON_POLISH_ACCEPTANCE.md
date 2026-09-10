# CONSTRUCTOR 01E.1 — SKYGLAZING VISUAL COMPARISON POLISH ACCEPTANCE

This is a UI/read-model polish pass based on direct side-by-side comparison between the FacadeFlow Constructor drawing and the provided SkyGlazing technical drawing.

## Observed mismatch corrected
- FacadeFlow frame/dividers were still visually heavy and UI-like; they now read lighter and more like outlined technical profiles.
- Grid remained more visible than needed; Technical Drawing now starts with Grid OFF and the optional grid is even fainter when enabled.
- In-field information used floating UI cards that interrupted opening symbols; the labels are now flatter and more drawing-like.
- The lower FIELD strip consumed too much vertical space; it is compacted to preserve more drawing area.
- The bottom dimension chain now represents module/bay spans from outer frame edges to divider centerlines for a simple single horizontal row. It does not pretend FIELD clear width is the same thing as module width.

## Dimension semantics safety
For a simple three-bay construction, the lower chain is a presentation read-model:
- outer frame edge -> divider centerline;
- divider centerline -> divider centerline;
- divider centerline -> outer frame edge.

FIELD clear dimensions remain FIELD clear dimensions and are labeled as FIELD inside the panes. No glass cut size is invented.

## Must remain unchanged
- Construction geometry and topology algorithms.
- Divider movement semantics.
- FIELD fixed/operable/opening semantics.
- Profile Resolution 02A / 02A.2 / 02A.3.
- BOM / Cut List / Machine stages.

MACHINE READY: NO

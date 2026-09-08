# Constructor 01A - FacadeFlow Constructor Shell

## Goal

Introduce the first dedicated CAD-like Constructor workspace opened from Module 1.
This phase establishes the FacadeFlow/Nadezhda shell only. It does not generate
parametric geometry or production data.

## Accepted workflow

1. The offer defines the common technical configuration.
2. Module 1 can open a dedicated `FacadeFlow Constructor` workspace.
3. The Constructor presents three primary areas:
   - construction tools on the left;
   - CAD-like grid workspace in the center;
   - offer context and selected-element properties on the right.
4. The common offer configuration is displayed as locked context:
   - profile system;
   - color;
   - foil mode;
   - glazing;
   - hardware standard.
5. Those offer values apply to every module in the offer and are not editable
   from the Constructor.
6. Grid visibility, snap UI state and zoom UI state can be changed in the shell.
7. The workspace includes rulers and a CAD status bar.
8. Module dimensions, when already entered, are shown as context but no real
   parametric frame is generated yet.
9. Tool buttons for frame, dividers and fields are visibly staged for later
   Constructor phases but are intentionally disabled in Constructor 01A.

## Boundaries

- Reference scheme -> real parametric geometry: NOT YET IMPLEMENTED.
- Parametric frame: NOT YET IMPLEMENTED.
- Mouse line selection / grips / drag-resize: NOT YET IMPLEMENTED.
- Divider creation and snapping: NOT YET IMPLEMENTED.
- PRELUDE visible profile widths/depth rendering: NOT YET IMPLEMENTED.
- Automatic geometry: NO.
- Machine-ready output: NO.

## Next planned phase

Constructor 01B - Parametric Frame:
- width / height driven frame;
- visual profile thickness foundation;
- line/edge selection;
- mouse resize grips;
- numeric dimension editing;
- live dimensions on the sketch.

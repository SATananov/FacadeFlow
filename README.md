# FacadeFlow

New clean-sheet FacadeFlow application.

The previous `FacadeFlow-Demo` repository remains a training/reference project. This codebase is the new real workflow and keeps the modern FacadeFlow visual language while building a deterministic construction core underneath it.

## Current workflow

`Клиент -> Обект -> Профилна система -> Цвят / фолиране -> Стъклопакет -> Обков -> Модул -> Конструктор`

## Constructor checkpoint

Current stage: **Constructor 01D.3.1 — Bottom FIELD Details UI Polish**.

Constructor 01D adds canonical FIELD semantics on top of the stable 01C.3.7 geometry:
- FIXED / OPERABLE field type;
- OPERABLE means one logical sash in the FIELD;
- opening mode: side-hinged / tilt / tilt-turn;
- optional human-entered left/right working handing where relevant;
- working opening symbols for side-hinged left/right, tilt, and tilt-turn left/right, following the Nadezhda/SkyGlazing-style shop convention;
- constructor semantics synchronize back to the offer module by canonical FIELD identity;
- profile resolution and machine geometry remain intentionally disabled.

- parametric outer frame;
- real `ПОЛЕ / FIELD` domain objects;
- vertical and horizontal `splitField` operations;
- recursive/local subdivisions (a divider can split only one selected FIELD);
- true frame-interior FIELD surfaces with live schematic dimensions;
- movable and removable local dividers; moving one same-axis divider preserves the absolute position of the others; divider length follows the parent FIELD automatically;
- sequential `Модул 1 / 2 / 3 ...` drafts with module switching and per-module Constructor state;
- current-module `Изтрий скицата / започни отначало` with Undo recovery;
- 10 mm snap, grid, zoom and numeric frame/divider position editing;
- legacy Constructor 01C draft migration;
- divider face width is read-only schematic until Profile Resolution; no invented profile, cutting or machine geometry.
- `Ъглов делител` creates real triangle/trapezoid polygon FIELD topology; vertical and horizontal dividers can re-split those polygon FIELDS and are clipped to the real polygon boundary.

The construction domain lives in `src/domain/construction/`. React renders this model; it is not the source of truth for topology.

## Commands

```powershell
npm install
npm run verify
npm run dev
```

## Constructor 01C.3.4 — Free Sketch Module Workspace

The free Constructor now requires an explicit module. Create Module 1, add sequential modules, switch between them, and keep an independent draft per module. The active module is visible in the Constructor context and can be reset without affecting other modules. Angled/polygon FIELD topology remains the next stage.

### Constructor 01C.3.5
Angled divider with independent top/bottom endpoints and real polygon FIELD topology. Profile resolution and machine geometry remain disabled.

### Constructor 01C.3.6
Angled-divider endpoints can anchor exactly to the parent FIELD inner corners. Corner anchoring supports real triangle as well as trapezoid polygon FIELD topology. The schematic divider face is clipped to the parent FIELD boundary; Profile Resolution and machine geometry remain disabled.

### Constructor 01C.3.7
Polygon FIELD re-split: vertical and horizontal dividers can split triangle/trapezoid FIELDS created by an angled divider. The physical divider face and span are clipped to the polygon boundary, nested dividers remain movable/removable, and the outer module geometry stays deterministic. Angled-on-polygon re-split remains deferred.


### Constructor 01D.1
The universal neutral X is replaced by working opening symbols used in the Nadezhda/SkyGlazing-style shop convention:
- side-hinged LEFT/RIGHT are mirrored;
- tilt has its own symbol;
- tilt-turn combines the side-hinged and tilt marks;
- FIX remains without an opening symbol;
- symbols are clipped by the canonical FIELD surface, including polygon/triangle/trapezoid FIELDS;
- semantic chips are separated from the symbol so labels remain readable.
These are constructor working symbols only. Profile, hardware and machine geometry remain unresolved.


### Constructor 01D.3
Canvas FIELD labels are reduced to a numeric white-circle marker only. Dimensions, FIX/КРИЛО semantics, opening mode and handing move to a horizontal details panel below the sketch. Working opening symbols remain on the FIELD surface; geometry, topology and production boundaries remain unchanged.


### Constructor 01D.3.1

- Bottom FIELD cards are taller and more readable.
- The active FIELD card has a stronger selected state.
- FIELD numbers use the same white circular badge language as the canvas.
- Cards keep a stable minimum width and the list scrolls horizontally for many FIELDs.
- Geometry, topology, opening symbols and FIELD semantics are unchanged.

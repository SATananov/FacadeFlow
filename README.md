# FacadeFlow

New clean-sheet FacadeFlow application.

The previous `FacadeFlow-Demo` repository remains a training/reference project. This codebase is the new real workflow and keeps the modern FacadeFlow visual language while building a deterministic construction core underneath it.

## Current workflow

`Клиент -> Обект -> Профилна система -> Цвят / фолиране -> Стъклопакет -> Обков -> Модул -> Конструктор`

## Release checkpoint

Current release: **FacadeFlow 0.1.8 — final 0.1.8B → 0.1.8E.1 checkpoint**.

Release 0.1.8 closes the current workflow/integration line without changing the production-safety boundaries:
- **0.1.8B — Atomic Module History 01:** Undo/Redo restores construction, profile resolution and module product type as one technical snapshot; history stays isolated per module during the current app session.
- **0.1.8C — Form → Constructor Transition 01:** preset FIELD semantics transfer only when canonical identity/count is safe; no divider or geometry is fabricated from form data.
- **0.1.8D — FIELD Glazing Ownership 01:** FIELD override > module override > offer default; incompatible bead assignments are invalidated, never auto-replaced.
- **0.1.8E — Integrated Acceptance 01:** two-module isolation, edit/Undo/Redo, Reset/Undo and Save/Reopen are covered together.
- **0.1.8E.1 — Human Undo Session Hotfix V2:** first-edit Undo and subsequent Redo availability are synchronized before parent callbacks/remounts can lose the session history.

Production boundaries remain explicit:
- AUTOMATIC GEOMETRY: **NO**
- AUTOMATIC BEAD SELECTION: **NO**
- RULES VALIDATED: **NO**
- MACHINE READY: **NO**
- SESSION UNDO HISTORY PERSISTED AFTER APP RESTART: **NO**

The Constructor foundation still includes:
- parametric outer frame;
- canonical `ПОЛЕ / FIELD` domain objects;
- vertical, horizontal and angled dividers with recursive/local FIELD subdivision;
- true frame-interior FIELD surfaces with live schematic dimensions;
- movable/removable local dividers and independent module drafts;
- current-module reset with Undo recovery;
- 10 mm snap, grid, zoom and numeric frame/divider position editing;
- polygon triangle/trapezoid FIELD topology and polygon re-split;
- FIXED / OPERABLE semantics and working opening symbols;
- human profile/glazing context without invented cutting or machine geometry.

The construction domain lives in `src/domain/construction/`. React renders this model; it is not the source of truth for topology.

## Commands

```powershell
npm install
npm run verify
npm run verify:release018
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
The universal neutral X is replaced by working opening symbols used in the Nadezhda/system-driven shop convention:
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

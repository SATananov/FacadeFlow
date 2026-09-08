# FacadeFlow

New clean-sheet FacadeFlow application.

The previous `FacadeFlow-Demo` repository remains a training/reference project. This codebase is the new real workflow and keeps the modern FacadeFlow visual language while building a deterministic construction core underneath it.

## Current workflow

`Клиент -> Обект -> Профилна система -> Цвят / фолиране -> Стъклопакет -> Обков -> Модул -> Конструктор`

## Constructor checkpoint

Current stage: **Constructor 01C.3.2 — Divider Production Semantics Correction**.

- parametric outer frame;
- real `ПОЛЕ / FIELD` domain objects;
- vertical and horizontal `splitField` operations;
- recursive/local subdivisions (a divider can split only one selected FIELD);
- true frame-interior FIELD surfaces with live schematic dimensions;
- movable and removable local dividers; divider length follows the parent FIELD automatically;
- 10 mm snap, grid, zoom and numeric frame/divider position editing;
- legacy Constructor 01C draft migration;
- field/opening semantics prepared in the model but intentionally not activated yet;
- divider face width is read-only schematic until Profile Resolution; no invented profile, cutting or machine geometry.

The construction domain lives in `src/domain/construction/`. React renders this model; it is not the source of truth for topology.

## Commands

```powershell
npm install
npm run verify
npm run dev
```

# Constructor 01C.1 — Canonical FIELD Topology

## Purpose

Constructor 01C.1 replaces the temporary full-span-grid assumption with a canonical construction topology built around real **ПОЛЕ / FIELD** objects.

The visual language of FacadeFlow remains unchanged: modern central work area, compact construction tools, contextual properties and the existing offer locks. This stage adopts only the useful construction discipline of established window-production software; it does not copy legacy UI patterns.

## Canonical model

- A newly created frame owns one root `FIELD` object.
- A divider never exists as an unrelated CAD line.
- `splitField(fieldId, axis, offsetMm)` replaces one leaf FIELD with two child FIELD objects and one divider.
- The split node preserves the original FIELD id as lineage metadata.
- Every live FIELD has its own stable id plus resolved `x/y/width/height` bounds.
- FIELD display numbering is derived from current geometry and is separate from the stable id.
- Field terminology is **ПОЛЕ / FIELD** everywhere in the new topology. The term "cell" is not part of the FacadeFlow domain model.

## Local divider behavior

- A vertical or horizontal divider splits only the FIELD that contains the click.
- Recursive subdivisions are supported. Example: split the module vertically, then split only the right FIELD horizontally.
- The second divider is local to the right FIELD and does not cross its neighbor.
- A selected local divider can be dragged and can receive an exact numeric offset measured inside its parent FIELD.
- Moving a parent divider respects the minimum geometry required by nested child fields.
- Deleting a divider merges that branch back to the FIELD that existed before the split.

## Frame behavior

- The existing parametric frame, resize, grid, 10 mm snap and zoom behavior remain.
- Resizing the outer frame preserves the FIELD tree and clamps divider offsets so nested fields do not collapse below the topology minimum.
- The Constructor draft persists the canonical topology using `constructor-01c.1` / `field-topology-01`.
- Legacy `constructor-01c` full-span drafts remain readable and are migrated into the FIELD tree.

## UI acceptance

- Live FIELD surfaces are selectable in the canvas.
- Each FIELD shows a subtle `ПОЛЕ N` identity and live `width × height` value without changing the FacadeFlow visual identity.
- The Properties panel can identify a selected FIELD, its stable id, size and position.
- Divider properties state that its scope is the parent FIELD, not the entire module.
- `Фиксирано поле` and `Отваряемо поле` remain disabled in this stage. The canonical FIELD object is ready for that later semantics step, but 01C.1 does not invent sash/opening data.

## Architectural boundary

The canonical topology is kept outside React in `src/domain/construction/`. React renders the model and dispatches construction operations; geometry/domain rules are not embedded only in canvas drawing code.

This stage intentionally does **not** resolve profile codes, profile visible widths, glazing deductions, sash geometry, hardware, BOM, cuts, machining or machine output.

AUTOMATIC PRODUCTION GEOMETRY: NO

PROFILE RESOLUTION: NO

MACHINE READY: NO

## Module synchronization

- Once a canonical topology exists, Constructor geometry becomes the source of truth for module width, height, FIELD count and FIELD widths.
- `ModuleInputSource` includes `constructor` so derived values are distinguishable from manual/preset input.
- The offer-side FIELD drafts retain human-entered semantics only when the same canonical `constructionFieldId` still exists.
- A newly created child FIELD does not inherit FIX/opening semantics by guesswork.
- Geometry-derived values are read-only in the offer form while topology is authoritative; structural edits return to the Constructor.

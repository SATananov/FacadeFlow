# Constructor 01C.2 — Physical Divider Semantics + History

## Purpose

Constructor 01C.2 keeps the canonical **ПОЛЕ / FIELD** topology from 01C.1 and fixes the next real construction problem: a divider must consume visible construction space instead of behaving geometrically like a zero-width CAD line.

The FacadeFlow visual identity remains unchanged. This stage improves construction behavior, field dimensions, local joints and correction workflow; it does not copy the legacy SkyGlazing interface.

## Physical divider semantics

- Every split divider owns a `thicknessMm` value in the canonical construction tree.
- Before Profile Resolution exists, FacadeFlow uses a neutral schematic divider face of **40 mm**.
- The 40 mm value is a construction placeholder for topology/rendering only. It is **not** a resolved profile code, production visible width or machining value.
- `offsetMm` has one explicit meaning: the clear size of the first child FIELD from its parent start edge to the leading face of the divider.
- A horizontal divider therefore resolves as: `upper FIELD + divider face + lower FIELD = parent FIELD height`.
- A vertical divider resolves as: `left FIELD + divider face + right FIELD = parent FIELD width`.
- FIELD bounds exclude the divider face. A divider no longer has zero-width geometry.
- Nested local dividers terminate at the real bounds of their parent FIELD, so a horizontal divider in the left FIELD meets the neighboring vertical divider instead of crossing through it.

## Minimum geometry and resize

- The topology minimum includes divider thickness in addition to the minimum FIELD sizes.
- Divider dragging and exact numeric placement clamp against both child subtree minima plus the physical divider face.
- Outer-frame resize preserves the FIELD tree and its physical divider footprint.
- Existing `field-topology-01` / `constructor-01c.1` drafts remain readable and are upgraded at runtime to physical divider semantics.
- New drafts persist as `field-topology-02` / `constructor-01c.2`.

## Visual acceptance

- Divider rendering uses the same restrained FacadeFlow profile language as the frame.
- The visible divider face is derived from `thicknessMm`, while its pointer hit area remains comfortable to select and drag.
- Local horizontal and vertical dividers visually meet the FIELD boundaries without artificial full-span extension.
- The Properties panel states the physical construction width and makes the measurement semantics explicit:
  - `Светъл размер ляво поле` for a vertical divider.
  - `Светъл размер горно поле` for a horizontal divider.
- The UI explicitly states that the divider width is schematic until Profile Resolution.

## Undo / Redo and correction workflow

- Constructor actions now keep bounded construction history.
- The toolbar `Undo` and `Redo` buttons become active when history exists.
- `Ctrl+Z` performs Undo.
- `Ctrl+Y` and `Ctrl+Shift+Z` perform Redo.
- `Delete` / `Backspace` removes the selected divider when focus is not inside an editable input.
- Add divider, delete divider, exact numeric divider movement and exact numeric frame resizing create history entries.
- Divider drag and frame-edge drag are recorded as one history transaction each rather than one entry per pointer move.
- Undo/Redo rebroadcast the restored topology so the offer-side module FIELD count and dimensions remain synchronized.

## Architectural boundary

Physical divider footprint belongs to the deterministic construction domain in `src/domain/construction/`, not to decorative CSS alone. React renders the resolved geometry and manages interaction/history; the domain owns FIELD and divider geometry.

This stage still does **not** resolve a concrete mullion/profile from a selected system. It does not calculate glazing deductions, reinforcement, BOM, cuts, machining or machine output.

FIELD TYPE / OPENING SEMANTICS: NOT YET

PROFILE RESOLUTION: NO

AUTOMATIC PRODUCTION GEOMETRY: NO

MACHINE READY: NO

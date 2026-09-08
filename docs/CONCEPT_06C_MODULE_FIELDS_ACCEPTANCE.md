# Concept 06C - Module fields

## Goal
Describe the conceptual fields inside Module 1 after the optional field count is known.

## Accepted behavior
- Each field is an independent optional draft.
- Confirmed field type presets are only:
  - `fixed` - Фиксирано
  - `operable` - Отваряемо
- A non-standard field can use `manual` source plus a free-text description.
- Each field may optionally receive a width in millimetres.
- Field-width entry supports the same hybrid pattern as the module dimensions:
  - unset
  - confirmed preset catalog
  - manual / non-standard
- No company-confirmed standard field widths are available yet, so the preset list stays empty.
- Changing the module field count resizes the conceptual field drafts while preserving existing fields by position where possible.
- Incomplete field descriptions do not block saving the module draft.

## Boundaries
- Field count does not create geometry.
- A field type does not create a sash, mullion, transom, or profile assignment.
- `operable` does not imply an opening direction or tilt/turn behavior.
- Field widths are not automatically balanced against module width.
- No production cuts or machine data are created.

## Safety state
- Automatic geometry: NO
- Machine ready: NO

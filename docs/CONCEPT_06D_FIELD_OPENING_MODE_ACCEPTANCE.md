# Concept 06D - Field opening mode

## Goal
Allow every preset `operable` module field to optionally describe how it opens without generating geometry or assuming hinge side.

## Accepted behavior
- Opening mode is available only when the field type is the confirmed preset `operable`.
- Opening mode remains optional at draft level.
- Confirmed opening-mode presets are:
  - `side-hinged` - Странично
  - `tilt` - Падащо
  - `tilt-turn` - Странично + падащо
- A non-standard opening can use `manual` source plus a free-text description.
- The same hybrid input principle is preserved:
  - unset
  - confirmed dropdown preset
  - manual / non-standard
- Changing a field away from `operable` clears stale opening-mode data.
- Module and field drafts remain saveable while opening modes are incomplete.

## Boundaries
- Opening mode does not assign left/right handing.
- Opening mode does not assign hinge side.
- Opening mode does not select a hardware kit, handle, hinge, lock, or profile.
- Opening mode does not create sash geometry, mullions, transoms, dimensions, or cuts.
- Manual custom field types do not automatically inherit an opening mode.
- No production or machine output is created.

## Safety state
- Automatic geometry: NO
- Machine ready: NO

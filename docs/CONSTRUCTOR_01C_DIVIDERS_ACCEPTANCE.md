# Constructor 01C — Parametric Dividers

## Purpose

Constructor 01C turns the FacadeFlow Constructor from a single parametric frame into a simple editable module layout. The frame can receive full-span vertical and horizontal dividers. These dividers split the module into conceptual **fields**.

## Accepted interaction

- `Вертикален делител` and `Хоризонтален делител` are active after a frame exists.
- A divider is placed by clicking inside the frame.
- A divider can be selected and moved with pointer drag.
- Snap remains a working 10 mm step when enabled.
- The selected divider exposes an exact numeric position in the Properties panel.
- Enter/blur commits the numeric position; Escape restores the current value.
- A selected divider can be deleted.
- The outer frame cannot be resized through a divider in a way that collapses the last field below the Constructor 01C minimum spacing.
- The visual dimension chain updates live and uses the term **полета**, not "клетки".

## Visual language

- Frame and divider faces remain conceptual, system-independent rendering.
- The frame uses four mirrored full-face 45° mitre lines. Each line runs across the complete visible frame face from the outer corner to the inner corner; short decorative ticks inside the glazing area are not accepted.
- Divider faces use a profile-like double-line visual treatment.
- Opening diagonals are **not** part of 01C. They belong to the field/opening semantics stage.

## Draft persistence

- Free-sketch drafts persist the frame plus dividers.
- `Свободна скица -> Създай оферта` preserves the construction draft so the same layout can continue as an offer module.
- Offer-mode Constructor uses the same Constructor engine and persists its module sketch draft in App state.

## Scope boundary

- Constructor 01C supports only full-span dividers.
- Partial/segmented transoms and recursive subdivisions are not classified as production geometry here.
- Divider positions are conceptual layout dimensions, not cutting dimensions.
- No profile code is inferred from a divider.
- No sash, fixed/operable field type, opening symbol, hardware, cutting, machining or machine output is generated.

AUTOMATIC PRODUCTION GEOMETRY: NO

MACHINE READY: NO

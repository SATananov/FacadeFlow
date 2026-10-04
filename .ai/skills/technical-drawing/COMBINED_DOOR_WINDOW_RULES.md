# Combined Door + Window Technical Drawing Rules

## Approved composition semantics

One module may contain any of these ordered functional regions:

- `WINDOW_REGION | ZERO_DIVIDER | DOOR_REGION` (`window-left`)
- `DOOR_REGION | ZERO_DIVIDER | WINDOW_REGION` (`window-right`)
- `WINDOW_REGION | ZERO_DIVIDER | DOOR_REGION | ZERO_DIVIDER | WINDOW_REGION` (`window-both`)

## Region and outline conventions

- Functional regions have independent explicit bounds and are top-aligned in the currently approved initial model.
- A window may be shorter than the adjacent door.
- The area below a shorter window is EXTERIOR VOID: not a FIELD, FIXED field, panel, glazing region, or construction element.
- Draw only actual functional-region geometry; the product outline may be stepped.
- `ZERO_DIVIDER` is derived from the actual shared region edge, has no physical width, and is not an ordinary divider.
- Do not add physical profile treatment, threshold geometry, or production perimeter continuity at the step without separate approval.

## Editing conventions

- Numeric dimension edits and direct mouse resizes update the same authoritative combined-region geometry.
- Editing one region changes that region only; other regions retain size and following regions translate as needed under the approved model.
- The explicit whole-module proportional-resize mode scales regions proportionally.
- Opening mode is configured separately within the functional region. `WINDOW_REGION` / `DOOR_REGION` is not the same as FIXED / OPERABLE, opening mode, or handing.
- Bottom-frame semantics and catalogue compatibility remain UNKNOWN / fail-closed unless separately classified and approved.

## Canvas and cards

- Keep the main sketch visually clean: no internal “Прозорец” / “Врата” labels or dimension pills.
- Semantic identity and current dimensions belong in the inspector and bottom field cards.
- Present `ZERO_DIVIDER` subtly as a semantic boundary, not a physical profile; detailed semantic information may appear in the inspector.

These are approved semantic/visual conventions, not production profile or assembly rules. See [dimension rules](DIMENSION_RULES.md) and [evidence rules](REFERENCE_EVIDENCE_RULES.md).

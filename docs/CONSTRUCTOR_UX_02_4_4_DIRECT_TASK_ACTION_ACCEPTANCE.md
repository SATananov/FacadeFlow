# CONSTRUCTOR UX 02.4.4 — Direct Task Action

## Goal

A first-time user must never have to ask where the action named by the guided inspector is located.

When a FIELD is selected and a technical input is missing, the top guided task driver keeps the exact next action visible and provides a large button that navigates to and focuses the corresponding existing manual control.

Examples:

- `Избери профил на касата` → `Към профила на касата`
- `Избери профил на крилото за Поле N` → `Към профила на крилото`
- glazing thickness → exact glazing thickness control
- glazing bead → exact manual bead selector

## Boundaries

- Navigation/focus only.
- No profile, glazing or bead auto-selection.
- Construction topology unchanged.
- PF01 / PF02 / AF01A semantics unchanged.
- Free Work retains the full technical inspector.

## Acceptance

The guided next-action button remains visible at the top while a FIELD is selected and takes the user directly to the correct control without requiring discovery of a smaller secondary control.

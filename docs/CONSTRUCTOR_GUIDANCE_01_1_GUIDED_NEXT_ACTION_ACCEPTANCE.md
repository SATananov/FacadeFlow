# CONSTRUCTOR GUIDANCE 01.1 — Guided Next Action

## Purpose

Make the first-use Constructor flow self-explanatory for a person who does not already know FacadeFlow's internal UI structure.

The user should not have to ask where to go next. The selected FIELD inspector must state the next required human action and take the user directly to the exact control.

## Accepted UX contract

For the selected FIELD, the guide shows one dominant current instruction:

1. FIELD type
2. Base profile
3. Human glazing thickness
4. Human glazing bead selection

The current instruction is rendered as `СЛЕДВАЩА СТЪПКА N/4` and exposes a task-specific primary action such as:

- `Избери профил на касата`
- `Избери профил на крилото`
- `Задай дебелина`
- `Избери стъклодържател`

The primary action:

- opens the `Профил` inspector tab;
- scrolls the exact required control into view;
- focuses the first enabled actionable control;
- visually marks the destination with `СЕГА ТУК`.

For OPERABLE FIELD without module product type, the guide points to the explicit `Прозорец / Врата` control before sash assignment.

## Safety / technical boundaries

This stage is UX-only.

- Construction topology: unchanged.
- Profile assignment: human-controlled.
- Glazing thickness: explicit human input.
- Glazing bead: human-controlled; no auto-select.
- Base-profile compatibility: still UNCONFIRMED.
- Glazing inset: UNKNOWN.
- Glass cut: UNKNOWN.
- Machine ready: NO.

## Human acceptance

A first-time user should be able to complete the FIELD flow without asking where the next control is located.

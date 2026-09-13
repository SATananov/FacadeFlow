# CONSTRUCTOR UX 02 — Guided Inspector

## Goal
Make the Constructor right inspector understandable for a first-time user without changing construction, profile-resolution, glazing, PF01/PF02, AF01A or manufacturing semantics.

## UX contract
- Default work mode is **Стъпка по стъпка**.
- Expert users can switch to **Свободна работа**.
- The right inspector no longer grows as one endless page on desktop; the selected-element pane scrolls internally while context and guidance remain visible.
- **Настройки на модула** is a full-width click target with an explicit `Отвори / Скрий` label and a large chevron.
- Free-sketch rows that are informational are no longer styled as fake clickable controls.
- Module-level guidance covers missing profile system, missing frame, and missing selection.
- Existing FIELD Guidance 01/01.1 is preserved in step-by-step mode.
- Full technical progress remains available in free-work mode.

## Non-goals / invariants
- No construction topology changes.
- No automatic profile, glazing bead, reinforcement or hardware selection.
- No technical compatibility promotion.
- No PF01/PF02 changes.
- No AF01A assembly-rule changes.
- No production or machine readiness changes.
- No commit / no push.

## Verify compatibility correction

The pre-UX02 free-constructor verifier expected dense component progress to be visible in the default inspector state. UX02 intentionally makes `Стъпка по стъпка` the default and moves that dense progress to `Свободна работа`. The verifier now explicitly switches to `Свободна работа` before asserting those badges. Product/domain behavior is unchanged.

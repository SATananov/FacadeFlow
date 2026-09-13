# CONSTRUCTOR UX 02.4 — Unified Inspector Layout

## Goal
Make Step-by-step mode calm and predictable for a first-time user without changing construction or technical domain semantics.

## Accepted UX contract
- The right inspector has one scroll owner in Step-by-step mode.
- Open module settings, selected-element panes, and optional details do not create nested scroll regions.
- Non-actionable offer-style rows are hidden from guided module settings.
- The selected element and its single current action remain the primary content.
- Secondary properties remain behind the existing `Подробности за …` disclosure.
- Technical status remains available but visually quiet.
- The developer overlay `SASH GEOMETRY · UNKNOWN` is not shown on the drawing in Step-by-step mode.
- Free Work preserves the full inspector and exposes the unresolved sash warning in Bulgarian.

## Non-goals
No changes to topology, project persistence, PF01, PF02, AF01A, profile resolution, glazing semantics, readiness, production or machine gates.

## Human acceptance
1. Open a module in `Стъпка по стъпка`.
2. Confirm only the whole right panel scrolls; no scrollbar appears inside module settings or element details.
3. Confirm the current action is visually primary.
4. Open `Подробности за Поле N`; confirm content expands naturally in the same panel scroll.
5. Confirm no `SASH GEOMETRY · UNKNOWN` developer label overlays the drawing.
6. Switch to `Свободна работа`; confirm full technical controls remain available.

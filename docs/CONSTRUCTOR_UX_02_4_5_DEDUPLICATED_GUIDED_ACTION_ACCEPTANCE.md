# CONSTRUCTOR UX 02.4.5 — Deduplicated Guided Action

## Goal

Keep one clear action owner in **Стъпка по стъпка**. When the top guided task already tells the user exactly what to do and where to go, the selected-element card must not repeat the same workflow card and button.

## Accepted behavior

- The top guided task remains the single actionable next-step card for frame, sash, glazing and bead tasks.
- While a direct guided target is active, the secondary FIELD workflow card is not rendered.
- The selected-element profile badge is status text only, e.g. `Липсва профил на касата`.
- FIELD type selection still exposes its explicit FIX / OPERABLE choices.
- Completed FIELD flow still exposes the explicit next destination.
- No automatic profile, glazing or bead selection is introduced.
- Domain, topology, PF01, PF02 and AF01A semantics are unchanged.

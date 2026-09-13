# CONSTRUCTOR UX 02.2 — Focused Guided Inspector

## Goal

Make the default **Стъпка по стъпка** experience calmer and easier to follow without changing any construction, profile-resolution, project, assurance, or assembly semantics.

## Accepted UX contract

- The guided inspector exposes one active task and automatically focuses the next missing FIELD control.
- Module settings stay collapsed while a FIELD task is active; the profile-system step can still open them explicitly.
- Once an OPERABLE module type is already known, its repeated selector is hidden from the guided profile pane; it remains available in **Свободна работа**.
- Joint detail, reinforcement detail, hardware detail, dense component counters, and the free-sketch offer action remain available in **Свободна работа**, but do not compete with the active guided task.
- Guided profile progress uses human wording such as **Остава да избереш 1 профил** instead of raw `1/2 · ЛИПСВА 1` counters.
- The internal inspector scrollbar remains available, but is thin and does not expose native arrow buttons.
- Completing one guided input moves focus to the next required control: profile → glazing thickness → bead, without selecting technical values automatically.
- Existing manual selection semantics remain unchanged.

## Explicitly unchanged

- Construction topology and FIELD identity.
- Profile candidate generation and human-only assignments.
- Glazing Context 01B: human thickness, candidate beads, human-only bead selection.
- Base-profile compatibility remains unconfirmed unless separately evidenced.
- Glazing inset and glass cut remain unknown.
- PF01 project/persistence semantics.
- PF02 revisions/evidence/confirmation semantics.
- AF01A resolver/readiness semantics.
- Production and machine gates.

## Verification

Targeted verifier: `scripts/verify-constructor-ux02-2-focused-guided-inspector.mjs`.

Regression requirements on the user machine:

- UX02 verifier
- UX02.1 verifier
- Guidance 01 / 01.1
- Free Constructor Profile Context 01
- full `npm run verify`
- lint
- build

No commit. No push.

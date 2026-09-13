# CONSTRUCTOR UX 02.3 — Single-focus Inspector

Status: implementation patch prepared; no commit / no push.

## Goal

Keep `Стъпка по стъпка` genuinely single-focus:

- show one active technical control at a time;
- keep unrelated properties out of the primary guided path;
- remove nested inspector scrolling from guided work;
- keep optional details available behind one large disclosure row;
- once a FIELD has its guided inputs entered, allow one explicit `Продължи` action so the top-level guide can advance to the next FIELD or assembly review.

## UX behavior

### Guided mode

- The field workflow card remains the primary task.
- When a guidance target exists, tabs are hidden and only the relevant control is exposed.
- Frame profile step: only the frame profile context is shown.
- Sash profile step: only the sash profile control is shown.
- Module type step: only the module type control is shown.
- Glazing thickness step: only the human thickness control is shown.
- Glazing bead step: catalogue candidates plus the human bead selector are shown.
- The guided technical pane uses the outer inspector scroll only; the inner pane does not create its own scroll region.
- When no active technical target exists, optional `Подробности за ...` remain collapsed by default.
- FIELD completion says `Полето е попълнено`, retains the compatibility warning, and offers `Продължи`.

### Free Work

The complete existing inspector tabs and technical content remain available unchanged.

## Domain boundaries

UX02.3 does not change:

- Construction topology;
- FIELD identity or semantics;
- profile resolution logic;
- glazing candidate derivation;
- human-only profile / glazing / bead selection;
- PF01 project graph or persistence;
- PF02 revisions / evidence / confirmation semantics;
- AF01A assembly or readiness semantics;
- production or machine readiness.

No automatic technical selection is added.

## Verification

Target verifier:

`node scripts/verify-constructor-ux02-3-single-focus-inspector.mjs`

Existing UX02 / UX02.1 / UX02.2 and Guidance 01 / 01.1 static regressions remain expected to pass. The apply launcher also runs the repository full verification, lint and build on the user's FacadeFlow checkout.

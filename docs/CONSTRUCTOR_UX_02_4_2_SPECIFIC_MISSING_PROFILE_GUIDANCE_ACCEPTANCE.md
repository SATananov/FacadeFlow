# CONSTRUCTOR UX 02.4.2 — Specific Missing Profile Guidance

## Goal

Make the guided inspector tell the human exactly which profile or technical input is missing instead of showing only a generic count.

## Accepted behavior

- One missing frame profile -> `Избери профил на касата`.
- One missing divider profile -> `Избери профил на делителя`.
- One missing sash profile -> `Избери профил на крилото за Поле N`.
- Multiple missing profiles -> compact count remains available.
- The top guided task also names the exact next missing field action: profile, glazing thickness, or glazing bead.
- No profile, glazing value, or bead is selected automatically.
- Construction topology, persistence, PF01, PF02, AF01A and technical readiness semantics are unchanged.

## Boundary

This stage changes guidance copy and navigation only. A human still makes every technical selection.

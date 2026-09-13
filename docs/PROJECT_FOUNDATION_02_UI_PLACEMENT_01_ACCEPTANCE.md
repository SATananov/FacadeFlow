# PROJECT FOUNDATION 02 — UI PLACEMENT 01

## Goal
Make the PF02 “Ревизии и доказателства” entry feel like a project-level command instead of a floating overlay above the Constructor canvas.

## Accepted behavior
- The assurance launcher is inside the existing project persistence / project command strip.
- The launcher participates in normal layout; it is not `position: fixed`.
- The project strip is sticky so Save / Project selection / Revisions stay accessible while the Constructor scrolls.
- The PF02 drawer remains an overlay when explicitly opened.
- STALE / review-required visual state remains available.
- Revision, evidence, confirmation, PF01/PF02 persistence and Construction topology are unchanged.

## Explicit non-goals
- No domain changes.
- No revision or confirmation semantic changes.
- No Construction topology changes.
- No technical resolution changes.

# ASSEMBLY FUNCTIONALITY 01A — Boundary-driven technical section resolution

## Purpose

FIX49 locked the visual baseline for one PRELUDE 60 joint. This step moves the
same technical presentation from profile-code conditionals in the React panel to
a reusable system-data pipeline.

The functional chain is now:

`ПОЛЕ -> physical edge -> support role -> real profile pair -> registered technical sections -> system rule -> technical joint view`

The operator does not choose a drawing template and does not position the normal
system preview manually.

## What changed

- A technical-section registry owns the reviewed catalogue section facts for the
  supported PRELUDE 60 profiles.
- Each registry entry carries the system ID, profile code, catalogue envelope,
  semantic role, graphic key and visual-only contour anchors.
- The automatic joint visualizer resolves profile sections by `systemId + profileCode`.
- The joint read model now carries its `systemId`, so technical-section lookup is
  scoped to the selected profile system instead of a global profile-code guess.
- React no longer chooses 482.30 / 482.21 / 482.05 graphics with pair-specific
  `if (profileCode === ...)` rendering logic. A graphic registry resolves the
  registered section instead.
- The same drafting pipeline now covers the two currently registered real joint
  families:
  - Frame 482.30 <-> Sash 482.05
  - Mullion 482.21 <-> Sash 482.05
- Left / right / top / bottom still use the resolved boundary side and the matched
  side-specific system rule.

## Fail-closed behaviour

A real profile pair is not visualized with invented placeholder geometry when a
technical section is missing. The visualizer returns `missing-section` and tells
the operator that the registered technical section is absent.

A pair with registered sections but no system construction rule returns
`missing-rule`.

## Knowledge boundaries preserved

- Catalogue envelope = reviewed technical-section/catalogue fact.
- Visible face = separate reviewed dimensional semantic.
- System correction = reference-derived system rule.
- Exact overlap / mate geometry = UNKNOWN until separate assembly evidence closes it.
- Contour anchors = annotation-only visual data.

`AUTOMATIC GEOMETRY = NO`

`RULES VALIDATED = NO`

`PRODUCTION AUTO-UNLOCK = NO`

`MACHINE READY = NO`

## Why this matters

FIX45-FIX49 proved one readable final assembly. 01A turns that presentation into a
repeatable mechanism: registering another reviewed technical section is now a
data task, not a rewrite of the assembly component.

This is the first functional step toward applying the locked technical-node
presentation to additional real boundaries and profile systems.

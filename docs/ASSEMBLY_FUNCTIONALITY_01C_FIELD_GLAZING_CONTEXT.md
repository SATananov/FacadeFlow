# ASSEMBLY FUNCTIONALITY 01C — FIELD GLAZING CONTEXT

## Goal

Connect each explicit **ПОЛЕ (FIELD)** to its glazing inputs inside Assembly Review without inventing glazing placement geometry.

01B proved boundary coverage for the profile joint. 01C adds the next context layer:

`FIELD -> effective glazing thickness -> structural base profile -> human-selected glazing bead -> compatibility status`

The profile joint remains the same system-driven boundary joint. Glazing context is attached to the FIELD and shown alongside the selected joint, but it does not alter the joint pose or profile assembly.

## Sources of glazing thickness

The effective thickness preserves the existing FacadeFlow precedence:

1. human-entered FIELD thickness;
2. FIELD glazing specification;
3. module glazing specification;
4. offer default;
5. unset.

The source is visible in Assembly Review.

## Base profile context

- FIXED FIELD -> selected frame profile;
- OPERABLE FIELD -> selected sash profile;
- unset FIELD -> no glazing target.

This reuses the existing Profile Resolution context and does not invent a different bead base.

## Bead status

01C reuses the existing glazing-bead compatibility evaluator.

A bead with matching nominal glass thickness is **not** promoted to structurally verified compatibility when a reviewed bead-to-base pairing rule is missing. It remains `unconfirmed`.

Missing glazing thickness, missing base profile, missing bead, and invalid bead assignment remain explicit.

## User-facing result

Assembly Review shows `ОСТЪКЛЯВАНЕ ПО ПОЛЕТА · 01C` with one card for every FIXED / OPERABLE FIELD.

The selected boundary joint also shows the glazing context for its owning FIELD, so the operator can see the profile joint and the glazing inputs together.

## Knowledge boundary

- NO glazing inset inference.
- NO glazing-seat geometry.
- NO glass cut dimensions.
- NO bead placement inside the final section.
- NO production promotion from a human bead selection alone.

The presence of glazing thickness and a bead code is input completeness, not proof of structural compatibility.

## Safety boundary

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- PRODUCTION AUTO-UNLOCK = NO
- MACHINE READY = NO

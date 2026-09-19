# ASSEMBLY FUNCTIONALITY 01D — JOINT GLAZING LINKAGE

## Purpose

Connect the already explicit 01C FIELD glazing context to each real 01B/01A profile-joint occurrence without inventing glass or bead placement geometry.

The linkage is identity-driven:

`FIELD identity -> sash profile identity -> joint linkage`

For an OPERABLE FIELD, the glazing base profile resolved by 01C must equal the sash profile used by the concrete boundary joint. If that identity does not match, the linkage fails closed.

## What 01D adds

- one joint-glazing linkage read model per actual profile-joint occurrence;
- FIELD ID and FIELD sequence preserved on every link;
- base profile code checked against the exact joint sash profile code;
- glazing thickness and human-selected bead propagated as context only;
- missing input, invalid input, missing FIELD context, and base-profile mismatch remain explicit blocked states;
- module summary of linked vs blocked joint occurrences;
- selected-joint view shows the exact FIELD-to-joint relationship.

## Knowledge boundary

A linked glazing context does **not** mean that the glass or glazing bead has a proven position in the technical section.

- NO bead placement inference
- NO glazing inset inference
- NO glazing seat inference
- NO glass cut dimensions
- NO automatic glass geometry
- NO promotion of UNCONFIRMED bead-to-base compatibility to VALID

The profile joint review remains independent from glazing input readiness. A technically reviewable frame/sash or divider/sash joint can remain available even when glazing input is missing; 01D marks only the glazing linkage as blocked.

## Safety state

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

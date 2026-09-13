# CONSTRUCTOR GUIDANCE 01 — First-use FIELD workflow

Status target: HUMAN UX REVIEW

## Purpose

A first-time Constructor user must not need prior FacadeFlow knowledge to discover the order of the human glazing workflow.

For a selected FIELD, the inspector exposes a persistent `КАКВО СЛЕДВА` guide with four visible steps:

1. `Тип ПОЛЕ`
2. `Базов профил`
3. `Стъклопакет`
4. `Стъклодържател`

The guide identifies exactly one next human action and routes the user to the relevant inspector context. When FIELD type is unset, FIX / OPERABLE can be chosen directly from the guide.

## FIX usability rule

For a FIX FIELD, the Profile tab also exposes the already-existing module frame profile assignment as:

`БАЗОВ ПРОФИЛ ЗА FIX ПОЛЕТО` / `ПРОФИЛ НА КАСАТА` / `ОБЩ ЗА МОДУЛА`.

This is a UI exposure only. The assignment remains the single shared frame profile in `ModuleProfileResolution`; no per-FIELD frame profile is created.

## Safety boundaries

- CONSTRUCTION TOPOLOGY: UNCHANGED
- PROFILE / GLAZING DOMAIN SEMANTICS: UNCHANGED
- AUTOMATIC PROFILE SELECTION: NO
- AUTOMATIC BEAD SELECTION: NO
- BASE-PROFILE COMPATIBILITY: UNCONFIRMED
- GLAZING INSET: UNKNOWN
- GLASS CUT: UNKNOWN
- MACHINE READY: NO

## Human acceptance

A new user selecting an unset FIELD should be able to follow the guide without external instruction:

- choose FIX or OPERABLE;
- choose the required base profile;
- enter explicit glazing thickness;
- see system + thickness gated bead candidates;
- select a bead manually.

At no point may the guide silently choose a profile, glazing thickness, or bead.

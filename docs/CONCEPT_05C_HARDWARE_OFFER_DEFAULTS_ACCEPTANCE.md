# Concept 05C — Hardware Standard + Offer Module Defaults

## Goal

Complete the common technical offer setup before the module workflow starts.

The offer now captures a brand-neutral hardware standard after glazing and
formalizes which technical selections future modules inherit from the offer.

## Human-confirmed hardware fact

For **KMG PRELUDE 60**:

- the hardware groove is treated as a standard European groove;
- special or rare hardware is not required;
- the offer does not need to lock to a specific hardware manufacturer.

The current common hardware selection is therefore:

- **Standard:** `standard-european` / “Стандартен европейски обков”;
- **Manufacturer:** `unspecified` / “Не е уточнен”.

No specific brand is promoted to an approved operational choice at this stage.

## Compatibility boundary

The PRELUDE 60 compatibility statement is human-confirmed operational data.
It is **not** automatically copied to PRESTIGE 70 or PRESTIGE PLUS.

For systems without a confirmed compatibility record, FacadeFlow shows the
selection but explicitly marks profile-system compatibility as not yet
validated.

## Offer-level module defaults

Before module creation, the offer defines these common technical defaults:

1. `profileSystemId`
2. `colorId`
3. `foilModeId`
4. `glazingId`
5. `hardwareStandardId`
6. `hardwareManufacturerId`

The canonical inheritance mode is:

`inherit-offer-defaults`

A future new module starts from these selections instead of asking the operator
to re-enter the same values for every module.

## Module-level scope

**Product type is not an offer-level default.**

Window / door type, dimensions, opening function, module-specific mechanism,
handles, hinges, locks, and other module details belong to the module workflow.

Concept 05C does not implement module geometry or module-specific hardware.

## Safety boundaries

- automatic geometry: **NO**;
- automatic hardware kit generation: **NO**;
- brand inference: **NO**;
- PRESTIGE hardware compatibility inference: **NO**;
- machine-ready output: **NO**.

## Acceptance

Concept 05C passes when:

- the hardware step follows glazing;
- the offer persists `hardwareStandardId` and an explicitly unspecified
  manufacturer;
- PRELUDE 60 standard-groove compatibility is represented without naming a
  required brand;
- unvalidated systems remain explicitly unvalidated;
- the continue-to-modules gate requires the hardware standard;
- offer module defaults are represented by a dedicated domain structure;
- product type is reserved for module-level work;
- prior concept contracts, lint, build, and diff hygiene pass.

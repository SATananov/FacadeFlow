# Concept 04B — Profile System Selection

## Purpose

Wire the offer workflow to the central profile-system catalogue created in Concept 04A.
The user selects the profile system only after the required client and object identity fields are present.

## User flow

1. Create a new offer.
2. Confirm the fixed contractor data for **НАДЕЖДА**.
3. Enter **Client / Contracting party**.
4. Enter **Object**.
5. Select **Profile system** from the central catalogue.
6. Continue with the remaining common offer parameters.
7. Modules remain the declared next step only.

## Catalogue-driven selection

The UI must not maintain a separate hardcoded system list.
It reads selectable systems through `getSelectableProfileSystems()`.

Current catalogue choices:

- KMG PRELUDE 60
- KMG PRESTIGE 70
- KMG PRESTIGE PLUS

The offer stores only the catalogue identifier in `profileSystemId`.
Detailed profile knowledge remains centralized in `src/data/profileSystems`.

## Gate

Profile-system inputs are disabled until both required identity fields are present:

- client name / company;
- object name.

The **Continue to modules** action remains disabled until a valid catalogue system is selected.

## Safety boundary

Concept 04B does not infer profile compatibility, calculate geometry, select reinforcements automatically, or create machine-ready output.
The selected system only establishes the technical catalogue context for later concepts.

## Acceptance

- [x] Offer draft persists `profileSystemId`, not a copied system object.
- [x] System cards are populated from `getSelectableProfileSystems()`.
- [x] Client + object identity gates system selection.
- [x] System selection is required before continuing to modules.
- [x] Selected system is resolved with `getProfileSystemById()`.
- [x] Offer summary shows the selected catalogue system.
- [x] Existing color, glazing, hardware and common-condition inputs remain available.
- [x] No automatic geometry or machine-ready claim is introduced.

## Next step

Concept 04C can define which common technical parameters are global offer defaults and which must be constrained by the selected profile system.

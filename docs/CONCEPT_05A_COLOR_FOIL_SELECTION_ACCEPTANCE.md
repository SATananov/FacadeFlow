# CONCEPT 05A — Color and Foil Selection — Acceptance

## Goal

After **Client -> Object -> Profile System**, FacadeFlow must require an explicit offer-level finish choice before the offer can continue to modules.

## Human-confirmed operational data

For the current Concept 05A scope, the confirmed finish data is:

- Color: **Антрацит** (`anthracite`)
- Foil mode: **Двустранно фолиран** (`both-sides`)
- Foil mode: **Външно фолиран** (`exterior-only`)

These values are **not claimed to come from the manufacturer PDF catalogue**. They are stored in a separate operational finish layer with `sourceStatus: 'human-confirmed'`.

## Data boundary

Manufacturer profile facts remain in the canonical profile-system catalogue. Human-confirmed finish choices live in `src/data/profileSystems/finishOptions.ts`.

For `exterior-only`, FacadeFlow records that the interior color is **unspecified**. It must not silently assume white or any other interior finish.

## Offer persistence

The offer stores identifiers, not duplicated display text:

- `profileSystemId`
- `colorId`
- `foilModeId`

Changing the profile system clears both downstream finish selections. Changing the color clears the foil-mode selection.

## UI flow

1. Client and Object are required before Profile System.
2. Profile System is required before Color.
3. Color is required before Foil Mode.
4. The module continuation action remains disabled until Profile System + Color + Foil Mode are valid.
5. Offer summary shows both Color and Foil Mode.

## Current selectable finish set

The same currently confirmed operational finish set is enabled for:

- KMG PRELUDE 60
- KMG PRESTIGE 70
- KMG PRESTIGE PLUS

This is an operational configuration for the present prototype, not a manufacturer-catalog compatibility claim. Future system-specific restrictions can be added without changing the offer schema.

## Safety boundary

- Automatic geometry: **NO**
- Automatic manufacturing decision: **NO**
- Machine ready: **NO**
- Exterior-only interior color inference: **NO**

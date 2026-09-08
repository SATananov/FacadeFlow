# Concept 06A — Module 1 Foundation

## Goal

Start the first real offer module after the common offer defaults are confirmed.

## Accepted flow

`Offer defaults -> Module 1 -> Product type + Width + Height`

The offer-level profile system, color, foil mode, glazing and hardware standard are copied into Module 1 as inherited defaults. They are not re-entered manually.

## Module 1 data

- stable draft id: `module-1`
- sequence: `1`
- inherited offer-default snapshot
- product type: `window` or `door`
- width in millimetres
- height in millimetres

## Inheritance boundary

Concept 06A creates a snapshot of the already confirmed offer defaults. It does not yet implement per-module overrides.

If the offer-level technical selections are changed before module work continues, the current concept resets the generated module draft so stale inherited data cannot silently survive.

## Explicitly not implemented

- multiple module creation
- mullions / sashes / fields
- opening direction or opening function
- module-specific hardware kit
- profile selection for individual members
- automatic geometry
- cutting calculations
- machine output

## Safety boundary

`AUTOMATIC GEOMETRY = NO`

`MACHINE READY = NO`

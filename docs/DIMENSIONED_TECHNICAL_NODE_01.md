# DIMENSIONED TECHNICAL NODE 01

## Goal

The joint screen must show a readable technical section with dimensions around the actual profile pair instead of only a visual assembly preview.

## What is shown directly on the section

- catalogue envelope dimensions for the support profile;
- catalogue envelope dimensions for the sash profile;
- the side-specific system correction as a reference callout;
- the profile pair and boundary orientation already resolved by FacadeFlow.

For PRELUDE 60 the known catalogue envelopes remain:

- 482.30 frame: 60 x 64 mm;
- 482.21 mullion: 60 x 84 mm;
- 482.05 sash: 60 x 56 mm.

Human-reviewed visible-face facts are kept separately:

- 482.30 frame visible face: 42 mm;
- 482.21 mullion visible face: 40 mm.

These visible-face facts are not silently converted into overlap or insertion geometry.

## Dimension provenance

The technical node separates four meanings:

1. catalogue dimension;
2. human-reviewed profile fact;
3. system-rule reference value;
4. unknown production dimension.

The system correction is displayed as a system-rule value only. It is not renamed as overlap.

## Safety boundary

Until separate exact assembly evidence exists, FacadeFlow does not infer or label:

- frame/sash or mullion/sash overlap;
- exact glazing inset;
- exact mate X/Y/rotation;
- manufacturing cut deductions.

The dimensioned technical view remains a system review and does not unlock BOM, production release, or machine output.

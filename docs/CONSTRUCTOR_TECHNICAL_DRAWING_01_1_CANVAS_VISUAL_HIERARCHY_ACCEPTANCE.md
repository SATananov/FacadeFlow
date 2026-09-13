# CONSTRUCTOR TECHNICAL DRAWING 01.1 — Canvas & Visual Hierarchy

## Purpose

TD01.1 is a visual-only pass over the existing Constructor drawing. It does not create or alter construction geometry. The goal is faster human reading of the same canonical model.

## Accepted visual direction

- drawing canvas stays white;
- minor grid is quieter and the major grid remains visible without competing with the product;
- the outer FRAME reads as the strongest construction boundary;
- DIVIDER faces remain clearly separate from FIELD glazing;
- OPERABLE sash reads as a light profile band between the support and glazing area;
- FIXED glazing stays sash-free;
- opening symbols remain attached to the operable sash and read after the profile hierarchy;
- selected FRAME / FIELD / DIVIDER receives a restrained FacadeFlow cyan emphasis without changing geometry;
- FIELD number badge stays secondary to the construction lines.

## Explicit non-goals

TD01.1 does **not** change:

- `ConstructorShell.tsx` drawing geometry or event logic;
- construction topology;
- FIELD bounds;
- divider positions, thickness rules or drag behavior;
- frame dimensions;
- sash/domain placement;
- profile-resolution rules;
- glazing evidence or bead resolution;
- project persistence;
- BOM, cutting or machine geometry;
- dimension-chain semantics.

## Safety boundary

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

## Human acceptance before commit

Open Constructor and visually check at least:

1. one FIXED FIELD;
2. one OPERABLE FIELD;
3. mixed FIXED + OPERABLE FIELDS with a divider;
4. selected FRAME, FIELD and DIVIDER states;
5. zoom in/out and pan;
6. Free Work and Guided mode.

Accept only if the drawing is visibly easier to read while all construction behavior remains identical.

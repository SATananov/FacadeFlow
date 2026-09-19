# AUTOMATIC SYSTEM ASSEMBLY VIEW 01

## Goal

Show the actual profile-pair assembly immediately when the user opens a resolved boundary.
The operator must not position profile drawings manually just to understand the joint.

## Construction logic

FacadeFlow uses the same information chain that already resolves the joint:

1. module topology resolves the physical side of the FIELD;
2. profile roles resolve Frame / Sash / Mullion participation;
3. the concrete profile pair resolves the reusable joint type;
4. the matched system construction rule supplies the side-specific reference correction;
5. FacadeFlow generates the section preview and rotates it for left / right / top / bottom use.

This adopts the useful system-driven principle observed in the user-supplied reference configuration KMG configuration: system data + side + construction rule -> generated section. It does not copy the reference interface or executable code.

## PRELUDE 60 profile section sizes used by the preview

- 482.30 frame: 60 x 64 mm catalogue envelope
- 482.21 mullion: 60 x 84 mm catalogue envelope
- 482.05 sash: 60 x 56 mm catalogue envelope

The profile raster sections come from the PRELUDE 60 catalogue assets already held by FacadeFlow.

## Safety boundary

The reference system correction is used to produce a visible system preview. It is not renamed to overlap and does not by itself prove exact production geometry.

A generated preview does not unlock:

- BOM production cuts
- production release
- machine output
- exact manufacturing dimensions

Those remain evidence-gated.

## UX result

The joint detail screen now leads with a large automatic section view. Rule data, evidence/source details, and custom-draft tooling are collapsed below it as expert information.

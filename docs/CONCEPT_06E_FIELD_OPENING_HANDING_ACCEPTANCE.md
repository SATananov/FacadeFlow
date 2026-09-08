# Concept 06E — Optional Working Opening Handing

## Goal
Allow an operable module field to carry an optional human-entered working left/right handing after the opening mode, without treating that value as production geometry.

## Accepted behavior
- Handing is optional and does not gate saving a module draft.
- Confirmed dropdown presets are `Ляво` and `Дясно`, plus manual/custom text.
- Handing is offered for side-hinged and tilt-turn opening modes.
- A manual/custom opening mode may also carry a manual or preset working handing.
- Tilt-only opening does not require or retain left/right handing.
- Changing the field away from operable clears opening and handing data.
- Changing a preset opening mode to tilt clears any previously entered handing.
- The module keeps hybrid input semantics: preset or manual custom.

## Safety boundary
`Ляво` / `Дясно` is only a human working label in Concept 06E. The reference viewing side has not yet been standardized, therefore the value MUST NOT be interpreted as hinge geometry, cutting orientation, machining direction, or machine-ready output.

## Still not implemented
- standardized inside/outside viewing convention
- physical hinge-side geometry
- inward/outward opening plane
- hardware kit selection from handing
- automatic sash/mullion geometry
- profile cutting or machine export

## Acceptance
- Contract verifier: `scripts/verify-concept06e.mjs`
- Automatic geometry: **NO**
- Machine ready: **NO**

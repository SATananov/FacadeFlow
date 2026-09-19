# SYSTEM JOINT RULES + LIBRARY RESOLUTION 01

## Goal

FacadeFlow now separates four different kinds of knowledge instead of treating a profile picture as an assembly rule:

1. **Catalogue component facts** — profile role, code, reviewed visible face, reinforcement compatibility, glazing bead thickness.
2. **Product topology** — modules, FIELDs, dividers and which physical boundary each operable FIELD touches.
3. **System construction rules** — reusable side/profile/correction rules that describe how a profile system is normally configured.
4. **Exact joint geometry evidence** — reviewed section/contact/placement evidence required before a joint cross-section is treated as exact production geometry.

## Reference-rule adoption

The reviewed reference dataset contains a KMG / PVC KMG 60mm configuration. FacadeFlow stores only the useful **construction semantics** as explicit reference rules; those values are not treated as manufacturer-certified exact joint geometry.

The current reference mapping includes:

- frame standard: `482.30-K` on four sides; FacadeFlow canonical catalogue code remains `482.30`;
- window sash standard: `482.05` on four sides;
- sash side corrections: top `8`, bottom `8`, left `8.5`, right `8.5` mm;
- `Assembly_Use_Rabbet=1`;
- sash `Pl=6`, `ReinfCorr=20`;
- divider `482.21`, including horizontal and vertical roles;
- divider `Pl=8`, `ReinfCorr=10`, connector `KM242=2` in the reference standard;
- glazing reference rule: `4 mm -> 482.14`, `24 mm -> 482.15`, `32 mm -> 482.22`, with reference glass corrections `12 / 12`.

These values are stored in `src/data/profileSystems/systemConstructionRules.ts` with explicit provenance and a fail-closed note.

## Joint library resolution

The module may contain many physical occurrences of the same joint. For example, a three-FIELD module can have eight sash boundaries but only two reusable joint types:

- `482.30 frame <-> 482.05 sash`
- `482.21 divider <-> 482.05 sash`

`systemDrivenProductModel.ts` now groups occurrences by a canonical library key:

`systemId : jointKind : supportProfileCode : sashProfileCode`

The UI shows one library card per type and lists every A-marker where it is used. Orientation remains local to the occurrence, so the same library type can use a different side correction on left/right/top/bottom.

## Safety boundary

A matched system rule is **not** the same thing as exact profile placement. It must not unlock:

- exact overlap;
- X/Y/rotation transform;
- exact glazing inset;
- production cut lengths derived from the unreviewed joint;
- machine export.

Those remain controlled by `jointAssemblyEvidence` and readiness gates.

## Next architecture layers

The joint library read model is intentionally ready for later persisted sources such as:

- manufacturer-verified joint;
- company-verified joint;
- user/company custom joint draft;
- reviewed custom joint.

Persistence and the custom-joint editor require an explicit project-schema change and are not silently added in this patch.

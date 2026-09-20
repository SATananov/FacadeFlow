# COMPOSITE MODULE STRUCTURE 01B — UI

Entry: **Структура на модул** in the existing main navigation. The panel is
separate from Constructor. App integration adds only an import, navigation item,
section type and render branch. The 01A domain remains unchanged and authoritative.

## Editing and validation

- Choose a system, add parts, enter function/dimensions, choose catalogue frame
  profiles and set the four sides explicitly. Different sizes and frame profiles
  from the same system are supported. No profiles are selected automatically.
- New parts have stable UUIDs, unset function/profile, empty `fieldIds`, blank
  dimensions and all four sides enabled. Enabled sides are UI starting values,
  not an engineering rule. Switching window/door only updates the function.
- The component state uses `CompositeModuleStructure` directly. While editing,
  empty dimensions are represented by `NaN` and displayed as blank. They cannot
  pass final validation. Positive finite dimensions are required; no totals,
  offsets or profile deductions are calculated. Function/profile may remain null
  as permitted by 01A; the summary identifies unselected values explicitly.
- `compositeModuleStructureDraft.ts` contains small immutable UI transitions and
  Bulgarian error translation, not a parallel domain model. Final validation
  always uses `validateCompositeModuleStructure` after basic form guidance.
- System changes clear incompatible frame profiles, preserving sides, dimensions
  and structural relationships. Candidates are only `role: frame` entries from
  the selected system.
- Choose two endpoints and add **Нулев делител**. `ZERO_DIVIDER` is the sole kind.
  01A rejects self/missing endpoints and duplicate equivalent connections. An
  unsuccessful action leaves the draft intact and displays a Bulgarian message.
- Deleting a part atomically removes all connections referencing it and clears
  endpoint selectors pointing to it. The UI explains this before deletion.
  Independent connections can also be removed. Part IDs remain stable even if
  display numbering changes. This temporary UI has no undo history.
- The live read-only summary displays the system, parts, explicit dimensions,
  profile codes, enabled sides, absent bottom frame and connections. Successful
  validation means **Структурно дефинирано**, never manufacturing approval.

## Scope and lifetime

Only component state is used. Leaving the section (unmount) or reloading loses
the draft, as stated in the UI. No persistence, migration, FIELD integration,
Model Assignment, geometry/placement engine or schematic preview is added.
Existing Constructor, Profile Resolution, Assembly Review, project/Model Library
storage and desktop logic are untouched.

## Automated checks

```
node scripts/verify-composite-module-structure01a.mjs
node scripts/verify-composite-module-structure01b.mjs
npm run lint
npm run build
git diff --check
git status
```

01B tests pure transitions, the actual panel event handlers via an in-memory
hook/element harness, source contracts and unchanged domain/persistence hashes.
This is not React DOM/browser acceptance. Actual keyboard input, focus, layout,
responsive presentation and visual clarity must be checked manually. No server,
application or browser is started by this task. Full verify is not required for
this isolated UI addition; package scripts are unchanged.

## Manual acceptance checklist — prepared, NOT executed

- [ ] Open **Структура на модул** and select **PRELUDE 60**.
- [ ] Add part 1: **Прозорец**, **1500 × 1500 mm**, frame **482.30**.
- [ ] Confirm **Горе / Дясно / Долу / Ляво** are all enabled.
- [ ] Add part 2: **Врата**, **700 × 2000 mm**, frame **482.20** from the same system.
- [ ] Disable only **Долу** for part 2. Other sides remain enabled.
- [ ] Connect part 1 ↔ part 2 with **Нулев делител**.
- [ ] Confirm the summary shows both sizes, both profile codes and **Долу: няма каса** for part 2.
- [ ] Confirm the UI states that exact joint geometry is undefined and compatibility needs human review; no calculated geometry/totals appear.
- [ ] Switch part 2 from door to window and back; its side selections must remain unchanged.
- [ ] Switch system to **PRESTIGE 70**; incompatible profiles clear, dimensions/sides remain, options contain only frame profiles from the new system.
- [ ] Try a self connection and a reversed duplicate connection; each shows a Bulgarian error without adding a connection.
- [ ] Delete a connected part; its connections and selected endpoint references disappear.
- [ ] Try blank, zero and negative dimensions; the summary must not report a structurally defined result.
- [ ] Check labels, keyboard operation, focus and narrow-screen readability.
- [ ] Leave/reopen the section or reload; confirm the temporary draft is cleared.

```
AUTOMATIC GEOMETRY = NO
RULES VALIDATED = NO
MACHINE READY = NO
ZERO DIVIDER EXACT GEOMETRY = UNKNOWN
FRAME-TO-FRAME COMPATIBILITY = HUMAN REVIEW
EXACT CUT / OVERLAP / INSET = UNKNOWN
```

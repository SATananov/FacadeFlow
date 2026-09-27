# COMPOSITE MODULE VIEW 01D.2B

The existing Constructor canvas now shows a read-only structural sketch for a Composite-only ProjectModule. The module identity, module navigation, canvas container, zoom, fit and pan remain shared with the existing Constructor. No second canvas, preview page or persisted construction is created.

## Selection and persistence

`selectModuleConstructorView` reads the active canonical ProjectModule. No Composite structure means the legacy Constructor. A structure with no persisted Constructor draft means the structural sketch. `hasModuleConstructorConstruction`, the same occupancy predicate as 01D.2A, gives persisted construction priority when historical data contains both. This includes a persisted outer frame without dividers. Form dimensions and a local initial seed are not occupancy.

Historical coexistence displays a short informational note and keeps both representations untouched. There is no migration, overwrite, split or deletion. Schema v1 structures without explicit placement show an unresolved message; schema v2 remains unchanged.

App passes the saved structure through the selection function to the same module's ConstructorShell. The existing structure editor remains the only editing surface. Save persists through the existing canonical workspace action, closes the editor and rebuilds the projection. Cancel closes the editor and keeps the previous saved sketch. No projection data enters project serialization, Constructor history or Model Library storage.

## Presentation

`src/components/compositeStructuralSketchProjection.ts` is a pure presentation helper. It validates the input and sorts a copy by explicit `placement.order`. Array order never supplies missing placement. Every part must have a resolved order and vertical alignment before any layout is displayed.

Nominal dimensions determine proportions, with a common normalization into arbitrary view units. TOP shares the upper reference; BOTTOM shares the nominal lower reference. Mixed alignments honor each part independently. Horizontal gaps and annotation lanes are arbitrary view spacing, not assembly clearances. Whole-layout bounds include all parts and connection annotations for the existing fit control. There is no displayed total engineering dimension, ruler or coordinate readout for this view.

`CompositeStructuralSketch` renders every explicit frame side independently. Three-pixel strokes are visual marks, not profile sections. A door with bottom=false has no bottom stroke; bottom=true restores it. The same rule applies to windows and unspecified functions. Bulgarian function labels and nominal dimensions appear inside parts and in the read-only module details; the details remain readable when many parts are fitted at a small scale.

Only explicit ZERO_DIVIDER relationships produce dashed annotations labeled „Нулев делител“. Endpoint IDs resolve the actual displayed parts, including non-adjacent parts and swapped orders. Neighboring parts without a connection receive no annotation. No width, cut, overlap, inset, joint rule or profile cross-section is inferred.

The canvas exposes no part drag, resize, reorder, side toggle or connection editing. Editing tools, FIELD inspector and Constructor history shortcuts are inactive for Composite view. Profile reconciliation does not publish changes from this view. Pan and zoom change only local viewport state. Non-Composite and historical Constructor views keep their existing FIELD, divider, sash, opening and dimension behavior.

## Defensive states

- Incomplete placement: „Позицията на рамковите части не е определена.“ and „Отвори „Структура на модула“ и подреди рамковите части.“ No geometry is displayed.
- Empty frameParts: „Добави рамкови части от „Структура на модула“.“ This is a defensive display state; the existing domain still rejects empty structures for persistence.
- Invalid structure: „Структурата на модула изисква преглед.“ No fabricated rectangle or crash.

## Verification

`node scripts/verify-composite-module-view01d2b.mjs` exercises the real pure projection and selection logic, all 16 side combinations for window/door/unspecified function, explicit and missing connections, N-part layouts, stable IDs, order swaps, TOP/BOTTOM/mixed alignment, immutability, invalid/empty/unresolved/v1 states, both free and offer App paths, real editor Save/Cancel and storage reload, shared fit/zoom/pan, effects and keyboard protection, and historical legacy rendering.

The original legacy frame-rendering body is fingerprinted against the approved 78cfcdd source. The 01D.2A whole-shell fingerprint is updated for the intentional 01D.2B integration; every other protected domain, editor, topology and storage fingerprint remains unchanged. Existing contracts and full regression verification still apply.

Required checks: Composite 01A, 01B, 01C, 01D.1, 01D.2A and 01D.2B verifiers; `npm run lint`; `npm run build`; `npm run verify`; `git diff --check`. Runtime event harnesses and builds do not start the application. Visual acceptance remains for the user.

## One manual acceptance scenario

Use a clean Composite-only module, for example Module 3. Add a window 1500 × 1500 mm, order 1, TOP, and a door 700 × 2000 mm, order 2, TOP, bottom=false. Explicitly connect them with ZERO_DIVIDER. Save and open Constructor for the same module.

PASS: the main canvas shows the window left and door right, common tops, wider window, taller door, no door bottom frame stroke, an explicit „Нулев делител“ annotation, the whole structure fitted in view, and no false legacy single-frame sketch.

## Boundaries

```text
APPLICATION NOT STARTED
NO npm run dev
NO BROWSER ACCEPTANCE
NO CONSTRUCTOR TOPOLOGY REPLACEMENT
NO FIELD INTEGRATION
NO MODEL ASSIGNMENT
NO AUTOMATIC ENGINEERING GEOMETRY
NO AUTOMATIC PLACEMENT
NO PRODUCTION GEOMETRY FROM SKETCH
NO COMMIT
NO PUSH
NO RELEASE

STRUCTURAL SKETCH PROJECTION = VIEW ONLY
PRODUCTION GEOMETRY FROM SKETCH = NO
AUTOMATIC GEOMETRY = NO
AUTOMATIC PLACEMENT = NO
FRAME PART PLACEMENT = HUMAN DEFINED
RULES VALIDATED = NO
MACHINE READY = NO
ZERO DIVIDER EXACT GEOMETRY = UNKNOWN
FRAME-TO-FRAME COMPATIBILITY = HUMAN REVIEW
EXACT CUT / OVERLAP / INSET = UNKNOWN
```

# FacadeFlow Visual Reference Rulebook 01

Status: HUMAN-APPROVED VISUAL REFERENCE RULES

Scope: technical sketch presentation for the current Module 2 window view.

SAAV source: [SAAV example window and door price configurations](https://saav.bg/primerni-czenovi-oferti/czeni-na-dograma-2/). The page presents example configurations and states that exact offers require consultation; its drawings are treated here as visual references only.

Primary references:

- `FF-REF-W03` — three-field window: OPERABLE / FIXED / OPERABLE.
- `FF-REF-W04` — side-hung and tilt-turn opening-symbol grammar.
- `FF-REF-C01` and `FF-REF-C02` — future combined door + window references; not implemented by this rulebook.

SAAV references:

- `FF-REF-S01` — 2-part window: FIXED + tilt-turn.
- `FF-REF-S02` — 3-part window: FIXED / OPERABLE / FIXED.
- `FF-REF-S03` — 3-part mixed opening: side-hung / FIXED / tilt-turn.
- `FF-REF-S04` — 4-part window with two operable fields.
- `FF-REF-S05` — door + window / “пистолет” style combined configuration; future use only.
- `FF-REF-S06` — sliding portal / sliding door; future use only.

These references define appearance and semantic presentation only. They do not prove KMG PRELUDE 60 physical geometry or catalogue compatibility.

## Reference priority

For ordinary windows and Module 2:

Primary:

- `FF-REF-W03`;
- `FF-REF-W04`;
- `FF-REF-S03`.

Secondary:

- `FF-REF-W01`, `FF-REF-W02`, `FF-REF-W05`;
- `FF-REF-S01`, `FF-REF-S02`, `FF-REF-S04`.

For future combined door + window work:

- `FF-REF-C01`, `FF-REF-C02`;
- `FF-REF-S05`.

For future sliding work:

- `FF-REF-S06`.

Reference priority controls visual comparison only. `FF-REF-S05` does not establish ZERO_DIVIDER physical geometry.

## 1. Frame

- Show a clear outer profile layer.
- Use schematic 45° corner mitre cues at valid frame corners.
- Use the strongest line hierarchy for frame contours.

## 2. Operable sash

- Draw a separate sash profile inside the field.
- Show four visible schematic 45° sash mitres.
- Keep the glazing/light opening inside the sash.
- Keep the opening symbol inside the sash/light opening.
- Hardware belongs to the sash, never to an unrelated divider.

## 3. Fixed field

- A FIXED field has no sash.
- A FIXED field has no opening symbol.
- A FIXED field has no handle or hardware.
- A centered `+` fixed marker is allowed as a visual-only presentation cue.

## 4. Hardware

- Hardware is schematic only.
- Use a compact vertical cue.
- Place it inside the closing-side sash member.
- Do not place hardware on a physical divider.
- Never show hardware on a FIXED field.
- Do not imply a manufacturer kit, exact mounting dimension, or fabrication detail.

## 5. Physical divider

- A physical divider is a real resolved profile member in the technical view.
- An operable sash may visually close against it.
- Exact overlap, inset, or profile interaction remains UNKNOWN unless separately verified.

## 6. ZERO_DIVIDER

- ZERO_DIVIDER is semantic only.
- It has zero physical thickness in the visual product presentation.
- It is not a mullion or physical divider profile.
- It creates no physical overlap, gap, or fake profile.

## 7. Opening symbols

For a left operable sash with the handle on the right:

- draw one line from the top-left glazing corner to the handle/closing point;
- draw one line from the bottom-left glazing corner to the same handle/closing point;
- add a tilt-turn line only when the actual opening mode requires tilt-turn presentation.

For a right operable sash, mirror the same behavior only when right handing is explicit.

For FIXED fields, draw no opening lines.

Opening-mode grammar:

- SIDE-HUNG uses two clean lines converging at the closing/handle side and no tilt line.
- TILT uses a separate tilt cue only.
- TILT-TURN uses the side-hung pair plus one additional tilt cue when that mode is explicit.
- Final product view does not use dashed debug helper lines.

Opening symbols are semantic presentation. They must stay field-local, use thin technical strokes, and contain no unrequested dashed helper geometry.

## 8. Line hierarchy

Strong:

- frame;
- sash;
- resolved physical divider.

Medium:

- glazing/light-opening boundary.

Light:

- opening symbols;
- helper symbols;
- dimensions.

## 9. Visual versus physical facts

- Profile visual width may be schematic for readability.
- Mitre cues are technical presentation cues.
- Opening symbols are semantic presentation cues.
- None of these visual conventions establish fabrication geometry.

Do not infer or persist exact profile widths, overlap, rebate, glazing inset, glass seat, hardware kit, threshold geometry, cut lengths, or other catalogue facts from these references. Unknown facts remain UNKNOWN. AUTOMATIC GEOMETRY = NO. RULES VALIDATED = NO. MACHINE READY = NO.

## 10. Module 2 alignment

- Field 1 is OPERABLE: sash, four sash mitres, explicit-hand opening symbol, and hardware inside the right closing-side sash member.
- Field 2 is FIXED: glazing/light field and optional centered `+`, with no sash, opening symbol, or hardware.
- Field 3 is OPERABLE: mirrored explicit-hand behavior with hardware inside the left closing-side sash member.

This rulebook does not change module dimensions, topology, divider positions, viewport behavior, persistence, resolver/build contracts, or ZERO_DIVIDER behavior.

## Visual consistency principle

When external references use different artistic styles, FacadeFlow prioritizes:

1. technical readability;
2. semantic correctness;
3. internal consistency;
4. minimal visual noise;
5. resemblance to the selected reference.

FacadeFlow does not copy site-specific styling literally. The SAAV examples may inform field composition, fixed/operable distinction, opening-symbol grammar, and visual hierarchy, but not physical construction facts.

# CONSTRUCTOR TECHNICAL DRAWING 01.2 — Sash & Opening Readability

## Scope

TD01.2 improves only the visual hierarchy of the existing canonical sash and opening symbols.
It does not introduce or infer manufacturing geometry.

## Visual intent

- the sash profile ring remains clearly separate from frame, divider and glazing;
- side-hinged left/right handing is the primary opening instruction;
- tilt lines are secondary when combined with side-hinged opening;
- pure tilt remains a continuous, easily readable symbol;
- the SVG handle circle is hidden because `preserveAspectRatio="none"` deforms it into an ellipse on non-square fields;
- the existing handle tick remains anchored to the glazing-side sash contour.

## Hard boundaries

- canonical `field.openingMode` is unchanged;
- canonical `field.openingHanding` is unchanged;
- field bounds are unchanged;
- divider topology is unchanged;
- profile resolution is unchanged;
- persistence is unchanged;
- no catalog dimensions are inferred;
- no hardware geometry is inferred.

## Required human browser acceptance

Review at least:

1. narrow left side-hinged field;
2. narrow right side-hinged field;
3. left tilt-turn field;
4. right tilt-turn field;
5. pure tilt field;
6. multi-field module with FIXED between two OPERABLE fields;
7. selected and unselected field states;
8. at least two zoom levels.

Acceptance goal: opening direction is readable immediately, but opening lines no longer dominate the profile hierarchy.

## Safety status

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

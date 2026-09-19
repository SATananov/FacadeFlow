# FIX42 · CLEAN PROFILE EXTRACTION 01

## Goal

Remove detached catalogue annotations and fragments from the 482.21 mullion image used in both stages of the joint review:

1. the separate participating catalogue profile;
2. the final assembly technical node.

The cleanup is image-only. It does not move, rotate, scale, infer, or validate any assembly relationship.

## What changes

- `prelude60-48221-mullion-clean.png` keeps only the connected 482.21 profile section and removes detached catalogue text/symbol fragments.
- `prelude60-48221-mullion-assembly.png` receives the same cleanup so the final assembly no longer carries those detached catalogue fragments.
- Original canvas dimensions are preserved, so no assembly coordinates or dimension-line geometry change.

## What does not change

- profile codes;
- catalogue dimensions;
- visible-face facts;
- system correction reference;
- joint orientation;
- overlap status;
- X/Y/rotation;
- production rules or readiness.

## Safety boundary

`UNKNOWN OVERLAP = EXPLICIT / NOT INVENTED`

`AUTOMATIC GEOMETRY = NO`

`RULES VALIDATED = NO`

`PRODUCTION AUTO-UNLOCK = NO`

`MACHINE READY = NO`

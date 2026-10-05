# Profile Identification Rules

1. Require the selected system/package context.
2. Prefer an exact article/profile code match.
3. Check semantic role and structural subtype.
4. Preserve imported `profileW` and `profileZ` as evidence values; do not convert them into geometry.
5. Compare catalogue/group context.
6. Use CAD/section evidence only when the referenced artifact is available and reviewed.
7. Return candidates and evidence status when identity is not unique.

Never identify a profile purely because another profile has similar dimensions.

Structural subtype values in the imported evidence are evidence mappings, not universal production rules. In particular, common mappings such as `1=Frame`, `2=Wing/Sash`, `3=Mullion`, and `5=Flying mullion` remain scoped to the source data.

Recognition is separate from permission: a recognized profile may still be unsupported for a requested role or product position.

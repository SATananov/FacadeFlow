# PROJECT FOUNDATION 02 — UI ACCESS HOTFIX

## Purpose

Make the existing PF02 revision/evidence/confirmation controls reachable from any Constructor scroll position without mixing project assurance into the FIELD inspector.

## Accepted behavior

- A persistent viewport-fixed **Ревизии и доказателства** launcher is always reachable on desktop Constructor screens.
- The launcher shows the current revision/draft state and flags confirmations that require review.
- The launcher opens a separate project-level drawer; the FIELD inspector remains unchanged.
- The drawer exposes the existing explicit flow: operator → record revision → select exact statement → inspect → explicitly confirm.
- Existing confirmations show whether they still match the current context or require review.
- Escape, backdrop click, or the close button dismisses the drawer.
- No ordinary edit, local save, dropdown choice, pan, zoom, or navigation creates a revision or confirmation.
- `BASE-PROFILE COMPATIBILITY: UNCONFIRMED`, `GLAZING INSET: UNKNOWN`, and `GLASS CUT: UNKNOWN` remain visible technical boundaries.
- No production, machine, BOM, pricing, topology, geometry, or automatic technical-resolution behavior is added.

## Verification

`node scripts/verify-project-foundation02-ui-access.mjs`

Full PF02/PF01 regressions, lint and build must continue to pass on the working repository.

**NO COMMIT / NO PUSH**

# PROFILE RESOLUTION 02A.2 — BEAD CONTEXT INTEGRITY HOTFIX

## Purpose

Tighten the 02A glazing-bead foundation so a raw catalog thickness match cannot be mistaken for resolved structural compatibility.

## Accepted domain rules

- UNSET FIELD -> NO BEAD TARGET.
- FIX FIELD -> bead target exists, but a human-confirmed FRAME profile is required before bead assignment is enabled.
- OPERABLE WITHOUT SASH -> MISSING CONTEXT; bead assignment is disabled until a human-confirmed sash profile exists.
- OPERABLE WITH SASH -> thickness-matching beads may be shown as catalog candidates.
- CATALOG MATCH != RESOLVED.
- A human bead assignment is not counted as RESOLVED until Compatibility Engine returns VALID.
- Current PRELUDE 60 data does not contain a reviewed bead-to-frame/sash pair rule, therefore a matching bead remains UNCONFIRMED.
- If FIELD type or required base profile disappears, stale bead assignments are reconciled away.
- BEAD progress means RESOLVED / explicit typed FIELD targets, not candidate count.

## Safety boundary

- CONSTRUCTION GEOMETRY / TOPOLOGY MUTATION: NO.
- PROFILE-AWARE CUT GEOMETRY: NO.
- BOM: NO.
- CUT LIST: NO.
- MACHINE OPERATIONS: NO.
- MACHINE READY: NO.

## Expected screenshot case

With two geometric fields where only one is explicitly OPERABLE and the second remains UNSET:

- PROFILE target count may include the OPERABLE sash requirement.
- BEAD must be `0/1`, not `0/2`.
- If the OPERABLE field has no sash profile, its bead panel must show MISSING CONTEXT.

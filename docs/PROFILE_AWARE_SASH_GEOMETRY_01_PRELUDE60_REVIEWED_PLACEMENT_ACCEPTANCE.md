# PROFILE-AWARE SASH GEOMETRY 01 — PRELUDE 60 reviewed front-elevation placement

## Scope

This stage enables **front-elevation sash placement only** for a rectangular OPERABLE field when the selected PRELUDE 60 profiles are fully covered by reviewed joint evidence.

Supported reviewed combination:

- frame `482.30` visible face = **42 mm**;
- mullion `482.21` visible center face = **40 mm**;
- sash `482.05` visible face = **56 mm**;
- frame-sash reviewed overlap = **22 mm**;
- mullion-sash reviewed overlap = **22 mm per side**.

The 22 mm value is evidence that the hidden support zone and sash overlap agree. It is **not** blindly added to the existing schematic FIELD bounds. The sash outer contour is positioned from the reviewed visible support faces:

- at an outside frame edge: from the product outer edge by the reviewed frame visible face;
- at a normal mullion edge: from the divider centerline by half of the reviewed mullion visible center face.

This avoids treating the existing schematic `60 mm frame / 40 mm divider` topology as physical overall profile-face geometry.

## Rendering

When `Profile View` is ON and all four edges are reviewed:

- the schematic fixed-pixel sash ring is hidden;
- a reviewed sash outer contour is rendered at the evidence-bound front-elevation position;
- the sash profile band uses the reviewed `482.05` visible face of **56 mm**;
- 45-degree mitre indicators remain confined to the sash profile band;
- the existing opening symbol remains a visual opening-direction layer and is not hardware geometry.

## Safety boundary

- Construction topology / FIELD bounds: **UNCHANGED**.
- Divider positions and frame size: **UNCHANGED**.
- `glazingInsetMm`: **UNKNOWN**.
- visible-glass size: **UNKNOWN**.
- glass cut size: **UNKNOWN**.
- exact rebate / gasket / bead placement: **UNKNOWN**.
- polygon / angled-field sash reconstruction: **DEFERRED**.
- BOM / cut list / machine instructions: **NO**.
- MACHINE READY: **NO**.

The read model is front-elevation review geometry only and always reports `mutatesConstructionGeometry: false` and `machineReady: false`.

## 01.1 — Evidence Gating & Render Alignment Hotfix

- Normal-divider support requires both coordinate agreement and full cross-axis
  FIELD-edge coverage within the existing `EPSILON_MM`. Exactly one covering
  candidate is required; zero or multiple candidates leave adjacency unresolved.
- Reviewed opening symbols use `innerProfileBoundsMm` relative to FIELD bounds.
  Profile View OFF and unresolved placement retain the schematic pixel inset.
- The reviewed inner contour uses domain bounds relative to the outer contour.
  Decorative outlines do not contribute to the containing-block dimensions.
- A reviewed front placement does not receive the legacy UNKNOWN sash-placement
  class. Glazing inset and glass cut remain UNKNOWN independently.
- `node scripts/verify-profile-aware-sash-geometry01-runtime.mjs` executes 25
  regression cases against the domain and actual TSX render callbacks in memory.
  It is also required by the existing sash verifier and therefore `npm run verify`.
  Coverage includes both local-divider axes, ambiguous supports, span tolerance,
  missing/wrong assignments, polygon deferral, frozen inputs, exact 56 mm inner
  bounds, three display scales and schematic fallback.
- The runtime suite was checked against the original coordinate-only joint
  implementation in memory: it fails on the foreign local-divider regression.

Human visual acceptance: **PENDING**. These checks do not replace browser review
of frame/divider hierarchy, selection, dimensions and opening-symbol appearance.
All engineering and production safety boundaries above remain unchanged.

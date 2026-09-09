# Constructor Inspector UX 01 — Compact Contextual Inspector

## Goal
Reduce vertical overload in the Constructor right-hand inspector before Profile-aware 2D geometry is introduced.

## UI contract
- Offer-wide locked settings stay visible as context but are collapsed behind **Общи настройки на офертата**.
- Free sketch remains explicitly **SYSTEM NEUTRAL**.
- The selected element is always identified at the top of the inspector.
- Profile Resolution progress is a compact `assigned / required` badge, not a full-height card.
- The selected element uses three contextual tabs:
  - **Свойства** — construction/editor controls only.
  - **Профил** — human profile assignment only.
  - **Размери** — Profile Resolution 01B dimensional read models and UNKNOWN gates.
- Technical boundary is preserved in a collapsed disclosure.

## Safety / architecture
- No construction domain rules change.
- No profile candidate rules change.
- No dimensional semantics change.
- No automatic profile selection.
- No profile-aware rendering is enabled.
- No machine geometry is generated.

## Boundary
`PROFILE-AWARE GEOMETRY: NO`

`MACHINE READY: NO`

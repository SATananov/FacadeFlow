# FacadeFlow 0.1.8E.1 — Human Undo Session Hotfix V2

## Human-smoke defect

In the Windows app, a real technical edit (for example changing a FIELD from FIXED to OPERABLE) could leave **Undo** disabled even though the product state changed.

## Cause boundary

The technical snapshot itself was correct, but history publication relied on React state/effects before the per-module session cache and refs became authoritative. A parent update or immediate remount/re-render path could therefore observe an empty history stack.

## V2 fix

- Publish Undo/Redo refs and the per-module session cache synchronously when a technical history entry is created.
- Preserve the accepted 0.1.8B source/verifier contract for Undo/Redo restore order.
- Publish the next Undo/Redo refs/cache synchronously before restored-state callbacks run.
- Keep history session-only; it is still intentionally not persisted across app restart.
- Do not change construction geometry, profile rules, glazing ownership, or manufacturing authority.

## Human acceptance

1. Start the Windows/Electron FacadeFlow app.
2. In Module 1 change one FIELD from FIXED to OPERABLE.
3. **Undo must become enabled immediately.**
4. Undo must restore the prior FIELD state.
5. Redo must become enabled and restore the changed FIELD state.
6. Switch to Module 2: its state/history must remain independent.

## Safety boundary

AUTOMATIC GEOMETRY: NO
RULES VALIDATED: NO
MACHINE READY: NO

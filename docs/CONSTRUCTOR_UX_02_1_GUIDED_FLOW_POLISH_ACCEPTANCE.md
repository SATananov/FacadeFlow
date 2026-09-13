# CONSTRUCTOR UX 02.1 — Guided Flow Polish

## Goal
Make the default **Стъпка по стъпка** experience obvious to a first-time user without changing construction, profile-resolution, evidence, assembly or production semantics.

## Accepted UX changes
- A compact **5-phase** progress indicator is shown with exactly one active global task when no specific element workflow is active.
- The frame step explicitly explains that drawing establishes the initial dimensions and that exact values remain editable under **Размери**.
- After a frame exists, the guide directs the user to the first FIELD whose type is not yet set.
- After FIELD types are set, the guide directs the user to the first FIELD with incomplete human technical inputs.
- When the basic human inputs are complete, the guide points to **Преглед на сглобката** rather than claiming technical readiness.
- FIELD guidance no longer shows four dense mini-cards in guided mode; it shows compact current-step progress and one active action.
- Module settings auto-collapse when switching module while in guided mode.
- Disabled construction tools are visually marked **ПО-КЪСНО** in guided mode.

## Hard boundaries
- No automatic profile selection.
- No automatic glazing-bead selection.
- No technical compatibility promotion.
- No topology mutation.
- No change to PF01/PF02/AF01A semantics.
- No production or machine readiness change.

## Verification
Run:

```powershell
node scripts/verify-constructor-ux02-guided-inspector.mjs
node scripts/verify-constructor-ux02-1-guided-flow.mjs
node scripts/verify-free-constructor-profile-context01.mjs
npm run verify
npm run lint
npm run build
```

No commit. No push.

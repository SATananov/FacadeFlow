# Task Handoff Protocol

All agent handoffs must use this structure exactly.

## Handoff Template

TASK

ROLE

FILES INSPECTED

FILES CHANGED

FACTS USED

ASSUMPTIONS

UNKNOWN ITEMS

DOMAIN IMPACT

GEOMETRY IMPACT

PERSISTENCE IMPACT

UNDO/REDO IMPACT

RISKS

VERIFIERS REQUIRED

STATUS

## Allowed Statuses

- INSPECTING
- IMPLEMENTING
- BLOCKED
- READY FOR VERIFICATION
- VERIFIED
- FAILED
- READY FOR HUMAN REVIEW

Only the Orchestrator may use `READY FOR HUMAN REVIEW`.

## Sequential Role Mode

When one runtime agent performs multiple roles sequentially, every transition must emit a handoff using this template. The specialist handoff must end with `READY FOR VERIFICATION` before the Verifier role begins. The Verifier role must independently inspect the diff and must not repair implementation.

# Human Review Protocol

Human review is required when a change affects:

- Visual technical sketches.
- Door/window/frame/sash/leaf rendering.
- Geometry or topology semantics.
- Catalogue facts.
- Persistence/history semantics.
- Undo/Redo behavior.
- Evidence status or acceptance criteria.
- User-facing workflow meaning.

## READY FOR HUMAN REVIEW Requirements

Only the Orchestrator may declare `READY FOR HUMAN REVIEW`.

Before doing so, the Orchestrator must have:

- Received implementation handoff from the primary agent.
- Received independent Verifier Agent result.
- Confirmed relevant verifiers were run or explicitly reported as not run.
- Confirmed global safety boundaries remain unchanged.
- Reported changed files.
- Reported whether source behavior changed.
- Reported whether geometry/domain changed.
- Reported whether persistence or Undo/Redo changed.
- Reported remaining risks and known limitations.

## Visual Drawing Review

For visual drawing/sketch changes, human acceptance must remain separate from automated verification. Automated verifiers can detect structural regressions, but they cannot replace human visual acceptance of technical readability.

## Sequential Role Mode

In Sequential Role Mode, the Orchestrator may declare `READY FOR HUMAN REVIEW` only after the Verifier phase has produced an explicit verification report. The same runtime agent may perform both phases, but the Verifier phase must re-read the diff and rules independently and must not repair implementation.

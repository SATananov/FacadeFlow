# PROJECT FOUNDATION 02 — UI POLISH 01
## Empty Statement Guidance

### Goal
When the project assurance drawer has no inspectable statements for the active module, the UI must explain why and tell the human what to do next instead of presenting an empty selector with no context.

### Accepted behavior
- The assurance drawer remains project-level and does not move into the FIELD inspector.
- If there is no active module, the drawer explicitly asks the human to select a module.
- If the active module has no `ModuleProfileResolution`, the drawer explains that the module is still system-neutral / lacks technical profile context.
- The guidance names concrete next human actions such as selecting a profile system and making a profile, glazing thickness or bead selection.
- A direct “Върни се към текущия модул” action closes the drawer only; it changes no domain state.
- If inspectable statements exist, the existing exact-statement selector, preview and explicit confirmation flow remains unchanged.
- Revision, evidence, confirmation and staleness domain behavior is unchanged.
- Construction topology is unchanged.
- `BASE-PROFILE COMPATIBILITY: UNCONFIRMED`, `GLAZING INSET: UNKNOWN` and `GLASS CUT: UNKNOWN` remain unchanged.

### Out of scope
- No automatic technical selections.
- No automatic revision recording.
- No automatic confirmation.
- No new evidence predicates.
- No production/readiness logic.
- No Construction topology changes.

### Verification
`npm run test:project-foundation02-ui-polish01`

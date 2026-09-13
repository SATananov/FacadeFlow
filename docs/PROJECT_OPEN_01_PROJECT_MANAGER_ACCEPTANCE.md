# PROJECT OPEN 01 — Project Manager

## Goal
Provide an explicit, human-readable way to open and create locally saved FacadeFlow projects without exposing stable internal project IDs.

## Accepted behavior
- The project strip shows the current project by a human-readable label.
- `Отвори проект` opens a dedicated Project Manager dialog.
- `+ Нов проект` creates a new independent project through the existing PF01 operation.
- Stored projects are listed by object/client-derived name; UUIDs remain internal.
- Each project card shows module count and recorded revision status.
- The current project is clearly marked and cannot be redundantly reopened.
- Corrupt/unsupported local records remain visible as unavailable and are not overwritten.
- The Project Manager is rendered through a document-body portal so project-strip CSS cannot distort modal controls.

## Boundaries
- Project/Offer/Module stable IDs are unchanged.
- PF01/PF02 persistence keys and storage ownership are unchanged.
- No delete, rename, cloud sync, sharing, archive, or server persistence is introduced.
- Construction topology and all technical resolution behavior are unchanged.
- No project UUID is used as a user-facing project name.

## Verification
- PROJECT OPEN 01 targeted verifier.
- USER FACING LANGUAGE 01 regression.
- PF01 runtime: 27 cases.
- PF02 runtime: 57 cases.
- Full `npm run verify`, lint, and build are required on the target workstation.

NO COMMIT / NO PUSH.

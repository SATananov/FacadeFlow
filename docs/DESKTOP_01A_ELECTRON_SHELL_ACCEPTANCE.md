# DESKTOP 01A - Electron Shell Acceptance

Status: HUMAN REVIEW PENDING

## Scope

- FacadeFlow runs in an Electron `BrowserWindow` using the production Vite build.
- Vite uses `base: './'` so built assets resolve from `file://`.
- Nadezhda branding uses the document-relative URL `./branding/nadezhda-header.png`.
- The Electron smoke test rejects missing or broken branding images.
- `nodeIntegration` remains disabled.
- `contextIsolation` remains enabled.
- Renderer sandbox remains enabled.
- Constructor, domain logic, project model and persistence are unchanged by DESKTOP 01A.

## Boundary

DESKTOP 01A provides the desktop shell only. Permanent Windows shortcut, custom FacadeFlow icon and installer belong to DESKTOP 01B.

# DESKTOP 01C.2 — Check for Updates

Baseline: `3964e17` (`desktop: accept manual update system 0.1.1`).

## Accepted scope
- Manual user-triggered `Проверка за обновяване` on the FacadeFlow home screen.
- Current version remains `0.1.1`; 01C.2 does not bump the application version.
- Electron main process queries the public FacadeFlow GitHub `master/package.json` for the published source version.
- Renderer receives only a narrow context-isolated bridge from `electron/preload.cjs`.
- If the published version is newer, the UI exposes `Свали обновяването`; this opens the host-locked HTTPS GitHub Releases page in the system browser.
- Network errors are shown without blocking normal FacadeFlow work.
- No check runs automatically on startup.

## Security boundary
- `nodeIntegration: false`
- `contextIsolation: true`
- renderer sandbox remains enabled
- no arbitrary external URL is accepted from renderer code
- no update executable is downloaded or launched by the app in 01C.2

## Deferred
- direct update download: DESKTOP 01C.3
- automatic update install/restart: DESKTOP 01C.3+
- differential/blockmap update transport: DESKTOP 01C.3+
- code signing: deferred

## Production boundaries
- Constructor/domain/persistence: unchanged
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

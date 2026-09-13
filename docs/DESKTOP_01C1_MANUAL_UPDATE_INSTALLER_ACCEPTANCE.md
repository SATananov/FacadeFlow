# DESKTOP 01C.1 — Manual Update Installer / Preservation Acceptance

Baseline: `2ae67d7` (`desktop: accept Windows installer`).

## Purpose
Establish the first safe manual update path from installed FacadeFlow 0.1.0 to 0.1.1.

## Contract
- Version advances to `0.1.1`.
- `appId` stays `com.facadeflow.desktop` so NSIS upgrade identity remains stable.
- Existing per-user install location remains unchanged.
- Desktop and Start Menu shortcuts remain managed by the same installer identity.
- The update package is named `FacadeFlow-Update-0.1.1.exe`.
- User data is not deleted by installer configuration.
- Update acceptance snapshots Chromium Local Storage before installation and requires a byte-identical manifest immediately after the installer completes, before the updated app is opened.
- A user-data sentinel must also survive the update.
- The installed executable must report product version 0.1.1 and pass the packaged Electron smoke test.

## User-facing version
The home screen displays `версия 0.1.1`, sourced from `src/appVersion.ts`.

## Important scope
This is a manual NSIS update package, not yet a small/differential network update. The file can still be close to the full installer size because Electron/Chromium are packaged with the application. Differential/blockmap delivery is deferred to DESKTOP 01C.3.

## Boundaries
- Automatic internet update check: NO
- Automatic download: NO
- Differential update: NO
- Domain / Constructor geometry: unchanged
- Project persistence schema: unchanged
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

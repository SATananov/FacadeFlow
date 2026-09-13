# DESKTOP 01C.3C — Install & Restart Engine

## Goal
Add the final human-initiated updater handoff after a release has already been downloaded inside FacadeFlow.

## Safety boundary
- No automatic background install.
- The user must press **Обнови и рестартирай** and confirm the restart prompt.
- Installation is allowed only in the packaged Windows app.
- The update EXE must be the canonical `FacadeFlow-Update-X.Y.Z.exe` in FacadeFlow's private `userData/updates` directory.
- Download metadata is persisted with file name, byte size and SHA-256.
- Immediately before installation, FacadeFlow rechecks metadata, byte size, SHA-256 and the Windows `MZ` executable header.
- A detached PowerShell handoff waits for FacadeFlow to exit before starting the NSIS installer silently with `/S`.
- After a successful installer exit, the helper relaunches the same installed executable path that was running before the update.
- NSIS remains per-user and `deleteAppDataOnUninstall=false`; project/user data storage is not migrated or deleted by this stage.

## Version strategy
This stage intentionally keeps source/visible version **0.1.2**. It is the local development seed that gains the Install & Restart engine. After this stage is human-accepted and installed locally, the next release test bumps to **0.1.3**. That lets the installed 0.1.2 seed detect, download, install and restart into 0.1.3 end-to-end.

## Acceptance now
1. `npm run test:desktop01c3c` PASS.
2. Full `npm run verify` PASS.
3. No constructor/domain/persistence changes.
4. No commit/push by the patch.
5. Do not publish a replacement `v0.1.2` release.

## Next human test
After commit/push of this stage, locally update the installed developer copy to the new 0.1.2 seed using the existing build-and-update-installed workflow. Then prepare and publish `v0.1.3` and test:

`0.1.2 seed -> Check -> Download 0.1.3 -> Обнови и рестартирай -> 0.1.3 running`.

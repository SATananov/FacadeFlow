# DESKTOP 01C.3D — Real Install Update 0.1.3 Acceptance

## Goal
Prepare FacadeFlow source version 0.1.3 without touching the locally installed 0.1.2 application. After commit/push and publication of GitHub Release `v0.1.3`, the installed 0.1.2 app will perform the real end-to-end path: check -> download -> human-confirmed install -> restart -> 0.1.3.

## V2 regression fix
The historical DESKTOP 01C.3B verifier originally asserted that the *current* package/app/lock version must always equal 0.1.2. That was valid only while creating release 0.1.2 and incorrectly blocked later legitimate patch versions. V2 keeps all historical 0.1.2 publisher/release assertions but changes the current version gate to require package, visible APP_VERSION, and lock root to match and to be at least 0.1.2 within the 0.1.x update line.

DESKTOP 01C.3C receives the same future-version treatment for its current-version gate while its install/restart security assertions remain unchanged.

## Acceptance boundaries
- Source and visible version: 0.1.3.
- Installed local app remains 0.1.2 until the real update test.
- Existing install/restart engine remains human initiated only.
- No background or startup-triggered installation.
- Stable appId, per-user NSIS install, and app-data preservation boundary remain unchanged.
- Constructor, domain model, topology, geometry, profile resolution, and persistence behavior are unchanged.
- No GitHub release, commit, tag, or push is performed by the prepare patch.
- Full verification must pass before accepting the prepared source.

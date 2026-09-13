# DESKTOP 01C.3a — Download Update Only

Baseline: `ce7bd4c` (`desktop: accept check for updates`).

## Purpose
When a newer version is detected, FacadeFlow downloads the exact GitHub Release asset itself instead of sending the user to a browser.

## Behavior
- Update checks remain manual/user initiated.
- A newer version exposes **Свали обновяването**.
- The main process resolves the exact `v<version>` GitHub Release asset named `FacadeFlow-Update-<version>.exe`.
- The asset is streamed to the private FacadeFlow user-data `updates` directory through a `.part` file and atomically renamed only after a successful download.
- The renderer receives only a narrow preload API; Node integration remains off.
- After download the UI says that the update is ready and can reveal the file in Explorer.
- The downloaded executable is **not run or installed** in 01C.3a.

## Safety boundary
- AUTO INSTALL: NO
- AUTO RESTART: NO
- DIFFERENTIAL UPDATE: NO
- CODE SIGNATURE / EXPECTED HASH ENFORCEMENT: deferred before automatic execution
- Constructor/domain/persistence: unchanged
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

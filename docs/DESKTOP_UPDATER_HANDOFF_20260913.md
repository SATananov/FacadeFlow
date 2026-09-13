# Windows updater handoff repair — 2026-09-13

## Scope and diagnosis
Source snapshot: 9abc5dd, package/visible version 0.1.4. Work is in the extracted handoff repository; the live repository and installed hotfixed 0.1.3 are not deployment targets.

The supplied reproduction establishes two failures: detached PowerShell exits without executing its payload, and the non-detached/unref child does not perform its post-parent action. The proven defect is relying on Node child spawn/unref for an independent Windows updater lifetime. unref only releases a Node event-loop reference. Windows process creation/console flags and inherited host Job Object lifetime are plausible mechanisms; the precise OS cause of the historical failures is NOT established without tracing that original launch environment. Do not label a suspected Job Object as a measured root cause.

References:
- https://nodejs.org/api/child_process.html
- https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects
- https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/create-method-in-class-win32-process

## Implemented contract
1. Existing explicit human confirmation, packaged-Windows gate, canonical userData/updates path, size, SHA-256 and MZ checks remain.
2. A unique transaction directory receives standalone scripts and a JSON request before quitting; worker files do not depend on the app.asar being replaced.
3. Node starts a non-detached hidden PowerShell bootstrap and captures errors/exit/timeout.
4. Local Windows WMI/CIM Win32_Process.Create creates the hidden worker. Bootstrap validates its token, PID, start time and parent session, then acknowledges and exits.
5. Node validates the transaction/worker acknowledgement and confirms the worker still exists AFTER bootstrap exit. It publishes authorization atomically, waits for a token/PID-bound worker authorization acknowledgement, and only then schedules app.quit.
6. Failure cancels the transaction and keeps the app open. Duplicate install requests are rejected. Unauthorized parent death cancels the worker.
7. After acknowledging authorization, the worker waits for the original parent identity to disappear (PID plus start time), repeats installer filename/size/SHA-256/MZ checks, invokes NSIS /S, requires exit code 0 and expected installed numeric product version, then relaunches the installed process.execPath with normal GUI window state. An immediately exited relaunch is logged as failure.
8. Installer, bootstrap and worker run hidden. No project data, constructor code, renderer permissions, NSIS identity/data preservation setting or version is changed.

Win32_ProcessStartup.ShowWindow=0 is used. A harmless native probe on this host returned Create result 21 with CREATE_NO_WINDOW and result 0 with ShowWindow=0 alone. The rejected flag was removed; no fallback to detached:true or unref is used.

## Verification
Run on real Windows:
- npm run test:desktop-handoff-survival
- npm run test:desktop01c3c
- npm run test:desktop01c3c1
- npm run test:desktop01c3d
- npm run test:desktop01c3e
- npm run verify
- npm run lint
- npm run build

The survival verifier creates a real Node parent, uses the production bootstrap/worker in probe mode, verifies READY, confirms no early action, exits the parent, and requires the worker's post-parent JSON result before a deadline. It also checks cancellation and bootstrap spawn failure. It deliberately exercises spaces, apostrophes and Unicode paths. Probe mode exits before all installer logic; no real installer is invoked. Evidence remains in a unique OS temporary directory printed by the test. Non-Windows execution explicitly reports SKIP and is not Windows survival evidence.

The four legacy updater verifiers now share assert-update-handoff.mjs. Old assertions for detached:true, child.unref(), an inline PowerShell body and a version-only READY flag encoded the superseded implementation. They are replaced with independent Windows creation, transaction identity, timeout/error handling, readiness-before-quit, parent wait, repeated integrity checks and version-before-relaunch checks. Existing human approval, release naming/version, AppData and packaged-Windows assertions remain. The survival test is registered in the complete verification chain. Historical acceptance documents and release publisher scripts remain unchanged.

## Release limitations
The harmless Windows test proves worker survival for this machine/account/host; it does not establish all enterprise WMI policy, provider job limits, session or packaged Electron environments. Provider failure must refuse the update and keep the app open.
No NSIS installer, packaged-app quit/relaunch, UAC transition or actual release update is exercised in this task. Numeric executable version validation does not distinguish prerelease/build metadata; the current release uses x.y.z. One second of process liveness is not application health confirmation. A launched old app during installation can still interfere with NSIS.
Updates are intentionally manual. Logs in userData/updates/handoff-<token> provide diagnostics after app exit; there is no new renderer recovery UI.
Source remains 0.1.4. A separately authorized release/version step and real packaged 0.1.4 -> 0.1.5 test are still required; do not republish the existing 0.1.4 asset as part of this repair.
The snapshot's package-lock already omits the pinned Electron build dependencies found in package.json. This repair does not alter dependencies or the lockfile; local checks use a private copy of the existing node_modules. Reproducible clean dependency installation remains a separate issue.

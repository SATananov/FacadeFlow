# DESKTOP 01C.3C.1 — Install handoff READY acknowledgement

## Observed real-world failure

The installed FacadeFlow 0.1.2 successfully downloaded and verified `FacadeFlow-Update-0.1.3.exe`, created `install-update-0.1.3.ps1`, then closed after the user selected **Обнови и рестартирай**. The installed executable remained at 0.1.2 and no helper install log appeared.

## Root-risk addressed

The previous handoff spawned a detached `powershell.exe`, immediately unreferenced it, and scheduled `app.quit()` after a blind 250 ms delay. There was no proof that the helper process had entered its script before the Electron process exited.

## Accepted contract

- Human confirmation remains mandatory.
- Downloaded installer is rechecked by canonical file name, size, SHA-256 and Windows executable header before handoff.
- The helper writes a READY marker as its first protected action.
- The Electron parent waits for that READY marker before quitting.
- Windows PowerShell is resolved through `%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe` instead of relying on PATH.
- Spawn failure and early helper exit are surfaced while the parent is still alive.
- The helper remains detached only after readiness has been proven.
- The helper waits for the parent process to exit, runs the NSIS installer with `/S`, waits for completion, and relaunches the same installed `process.execPath`.
- User-data preservation boundaries are unchanged.
- No automatic background installation is introduced.
- Constructor, domain, topology and persistence logic are unchanged.

## V4 patching note

V4 replaces the two legacy verifier files as complete contract verifiers rather than applying brittle exact-text edits. This avoids false failures caused by CRLF/LF differences or by verifier implementation details while preserving the actual safety contract.

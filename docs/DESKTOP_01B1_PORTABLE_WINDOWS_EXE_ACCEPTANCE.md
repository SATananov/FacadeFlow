# DESKTOP 01B.1 — Portable Windows EXE

## Goal
Package the accepted DESKTOP 01A Electron shell as a real Windows x64 portable executable before introducing an installer.

## Accepted boundary
- Windows target: `portable`, x64 only.
- Product name: `FacadeFlow`.
- Output: `release/FacadeFlow-Portable-0.1.0.exe`.
- FacadeFlow icon is embedded for Windows packaging and supplied to the runtime `BrowserWindow`.
- Existing Electron security boundary remains unchanged: Node integration off, context isolation on, renderer sandbox on.
- Existing React, Constructor, domain, project, persistence, profile resolution and geometry behavior are not redesigned by this stage.
- `release/` is generated output and must not be committed.

## Human acceptance required
The generated portable EXE must be opened directly on Windows and visually checked for:
1. startup without VS Code, npm, CMD or VBS launchers;
2. FacadeFlow title and app icon in the Windows shell/taskbar;
3. branding assets rendering correctly;
4. Constructor and project UI opening normally;
5. close/reopen behavior.

## Deferred to DESKTOP 01B.2
- NSIS installer;
- automatic Desktop shortcut;
- Start Menu entry;
- uninstall entry;
- installer UX and upgrade behavior;
- code signing.

## Safety status
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

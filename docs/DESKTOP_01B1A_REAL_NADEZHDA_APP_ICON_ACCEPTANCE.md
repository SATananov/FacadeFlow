# DESKTOP 01B.1a — Real Nadezhda App Icon

Baseline state: DESKTOP 01B.1 applied on top of `a33bb85` (`desktop: accept Electron shell`), not yet committed.

## Purpose
Refine the Windows application icon so the portable EXE and current Desktop shortcut use the real Nadezhda logo rather than the simplified symbol-only icon.

## Repository changes
- `build/FacadeFlow.ico`: replaced with a full-logo Nadezhda Windows icon.
- `docs/DESKTOP_01B1A_REAL_NADEZHDA_APP_ICON_ACCEPTANCE.md`: acceptance boundary.

## Non-repository refresh
- If `%LOCALAPPDATA%\FacadeFlow\Launcher\FacadeFlow.ico` exists, it is refreshed.
- If `Desktop\FacadeFlow.lnk` exists, it is recreated so Windows picks up the new icon.
- `release/FacadeFlow-Portable-0.1.0.exe` is rebuilt and copied to Desktop again.

## Boundaries
- Installer: NO (`DESKTOP 01B.2`)
- Domain / Constructor / persistence redesign: NO
- Electron security posture: unchanged
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

# DESKTOP 01B.2 — Windows Installer

Baseline: `53f9a44` (`desktop: accept portable Windows exe and Nadezhda icon`)

## Purpose
Package FacadeFlow as a normal Windows NSIS installer after the portable EXE has been accepted.

## Installer contract
- Artifact: `FacadeFlow-Setup-0.1.0.exe`
- Target: Windows x64 NSIS assisted installer
- Product name: `FacadeFlow`
- App ID: `com.facadeflow.desktop`
- Desktop shortcut: `FacadeFlow`
- Start Menu shortcut: `FacadeFlow`
- Installer / uninstaller icon: `build/FacadeFlow.ico`
- Install scope: current Windows user (`perMachine: false`)
- Installation directory: user may change it
- Run after finish: enabled
- App data is preserved on uninstall by default

## Boundaries
- No automatic installer execution during APPLY
- No code signing certificate is introduced
- Constructor/domain/persistence logic is unchanged
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

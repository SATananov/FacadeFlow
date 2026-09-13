# DESKTOP 01C.3E — Real READY-ACK Update 0.1.4

Purpose: prepare and publish a clean `0.1.4` release to retest the full in-app updater from the locally installed hotfixed `0.1.3` seed.

Acceptance boundaries:

- Source and visible app version become `0.1.4`.
- Installed local app must remain `0.1.3` until the end-to-end test.
- Existing READY-ACK helper handshake remains intact.
- Update remains user initiated: Check → Download → Update and restart.
- Pre-install integrity checks remain SHA-256, size, canonical filename and Windows executable header.
- Stable Electron app id, per-user NSIS install and user-data preservation boundaries remain unchanged.
- No constructor, domain, geometry, profile-resolution or persistence behavior is changed.
- No automatic background installation is introduced.

Real test target after release publication:

`0.1.3 → detect 0.1.4 → download → human confirmation → helper READY ACK → app quit → NSIS /S → relaunch → visible version 0.1.4`.

# DESKTOP 01C.3F — Real Windows-native update 0.1.5 — HUMAN ACCEPTANCE

Date: 2026-09-13

## Result

HUMAN ACCEPTANCE: PASS

The real installed FacadeFlow Windows application successfully completed the end-to-end update flow from **0.1.4** to **0.1.5** using the repaired Windows-native updater handoff.

Observed real-user flow:

1. Installed FacadeFlow 0.1.4 checked for updates.
2. GitHub release v0.1.5 was detected.
3. `FacadeFlow-Update-0.1.5.exe` was downloaded by the application.
4. The user explicitly selected **„Обнови и рестартирай“**.
5. The Windows-native WMI/CIM updater handoff took control.
6. FacadeFlow closed only after the independent worker authorization/acknowledgement boundary.
7. The NSIS update completed.
8. FacadeFlow relaunched successfully as **0.1.5**.
9. The user confirmed that the update flow works.

## Accepted updater contract

- update check: PASS
- in-app download: PASS
- human-initiated install: PASS
- WMI/CIM independent worker handoff: PASS
- atomic authorization + worker acknowledgement before app quit: PASS
- installer execution after parent exit: PASS
- automatic relaunch: PASS
- installed version after update: 0.1.5
- canonical filename / size / SHA-256 / MZ safety checks: retained
- user-data preservation boundary: retained
- Constructor/domain/persistence: unchanged
- automatic background install without user approval: NO

## Milestone

The FacadeFlow Windows updater is accepted as a working end-to-end baseline for future releases.

Future releases should preserve the same safety contract and continue to be exercised with the dedicated Windows handoff survival verifier.

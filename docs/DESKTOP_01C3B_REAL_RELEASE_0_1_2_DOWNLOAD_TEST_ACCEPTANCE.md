# DESKTOP 01C.3b — Real Release 0.1.2 + Download Test

Baseline: `715709b` (`desktop: accept update download engine`)

## Purpose
Publish the first real update release (`v0.1.2`) while keeping the locally installed FacadeFlow on `0.1.1`, so the in-app update checker and downloader can be tested end-to-end.

## Source changes
- Bump package and visible app version to `0.1.2`.
- Make 01C.1 / 01C.2 / 01C.3a regression verifiers future-version tolerant while preserving version consistency checks.
- Add release publisher guarded by clean Git state, `origin/master` parity, GitHub CLI authentication, canonical asset name and packaged smoke test.

## Release contract
- Git tag: `v0.1.2`
- Asset: `FacadeFlow-Update-0.1.2.exe`
- Companion blockmap: published for future differential-update work.
- Installed local `0.1.1`: NOT updated by release publication.

## Human acceptance sequence
1. Apply and verify this patch.
2. Commit and push source `0.1.2`.
3. Publish `v0.1.2` with the generated publisher script.
4. Open the still-installed `0.1.1`.
5. Press **Проверка за обновяване** -> expect available `0.1.2`.
6. Press **Свали обновяването** -> expect in-app download, no browser.
7. Do not install yet; install/restart belongs to 01C.3c.

## Boundaries
- Automatic install/restart: NO
- Constructor/domain/persistence changes: NO
- User data preservation contract: unchanged
- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO

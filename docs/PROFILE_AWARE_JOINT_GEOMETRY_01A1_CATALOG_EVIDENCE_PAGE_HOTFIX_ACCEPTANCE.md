# PROFILE-AWARE JOINT GEOMETRY 01A.1 — Catalog Evidence Page Hotfix

Status: **HOTFIX / BUILD CONTRACT**

## Cause

01A introduced two reviewed `assemblyEvidence` records typed as `CatalogEvidence`, but omitted the required `page` field. TypeScript correctly rejected both records.

## Fix

- Both PRELUDE 60 reviewed assembly-evidence records now include `CatalogEvidence.page: 2`.
- Page 2 is the catalogue page containing the PRELUDE 60 main profile drawings used for the reviewed `482.30`, `482.05`, and `482.21` face semantics.
- Reviewed front-elevation overlap remains **22 mm**.
- `sashInsetMm` remains **UNKNOWN**.
- `glazingInsetMm` remains **UNKNOWN**.
- Constructor geometry mutation: **NO**.
- Machine ready: **NO**.

BUILD TYPE ERROR: FIXED

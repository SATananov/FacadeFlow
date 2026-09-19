# EVIDENCE REVIEW 01B — HUMAN SOURCE REVIEW

## Goal

Turn the two EA01A ALTEST source-bound candidates into **explicit human-reviewable evidence statements** without promoting either statement into a construction or production rule.

FacadeFlow terminology for these visuals is **technical sketch / скица**, not "drawing" or "рисуване".

## Source scope

Official ALTEST technical PDF:

- source: `https://altestgroup.com/pdf/system/40/bg.pdf`
- page: `23`
- source section: `sectional drawings · scale 1:1`
- locator: `482.30 · 482.05 · 482.15 · 24 mm`

EA01A already registers two candidates:

1. `482.15 ↔ 482.05` bead/base pairing depiction.
2. Relative placement depiction of `482.15` and `482.05` in the 24 mm technical sketch.

## 01B behavior

01B adapts each candidate into the existing PF02 assurance graph as a **module-scoped, source-bound statement**. A human operator can review the exact source through `РЕВИЗИИ И ПРОВЕРКИ`, after recording the current revision, and create a `technical-review-attestation`.

The Assembly Review card then reads that current confirmation and shows `HUMAN-REVIEWED` with reviewer and timestamp.

The confirmation is intentionally narrow:

- it attests that the cited official technical sketch depicts the recorded pairing / placement context;
- it does **not** create a universal bead/base compatibility rule;
- it does **not** extract numeric glazing inset, seat, bead placement coordinates or glass-cut dimensions;
- it does **not** close the 01F evidence gap yet;
- it does **not** promote automatic geometry or machine output.

## Invalidation

The confirmation remains tied to the exact module dependencies and recorded revision. If the technical context changes, PF02 freshness makes the historical confirmation stale and the review card no longer treats it as current accepted evidence.

## Safety boundary

HUMAN REVIEW != REVIEWED APPLICATION RULE

RULE PROMOTION = NO

AUTOMATIC GEOMETRY = NO

RULES VALIDATED = NO

MACHINE READY = NO

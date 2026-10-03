# PRELUDE 60 DOOR EVIDENCE FOUNDATION 01

## Scope and architecture

Evidence/catalogue foundation only, transcribed from the completed
PRELUDE 60 DOOR CATALOG AUDIT 01 and the user's implementation specification.
No additional technical facts were inferred or externally acquired.

`src/data/profileSystems/prelude60DoorEvidence.ts` is an evidence companion to
the existing canonical `prelude60.ts`. PDF identities, raw callouts and stated
relationships reuse the existing catalogue entries. It does not introduce a
second selectable catalogue. Existing PRELUDE records and component inventory
are unchanged. Database codes remain source-specific annotations, particularly
`482.30-K` versus PDF `482.30`; no alias or suffix normalization is registered.

The companion reuses assurance `SourceReference` locators and canonical
fingerprint/immutability helpers. Each capture has its own source reference,
classification and capture digest. Digests describe captured data, not source
file authentication. External edition and source-file hashes remain unknown.
MDB locators identify archive versus installed files, tables, rows and fields;
PDF locators identify `PVC Prelude_bg.pdf`, page index and section. The source
files are not copied into this package. The completed audit is the provenance
for bounded interpretations, conflicts and missing-evidence findings.

This evidence is intentionally not wired into the runtime barrel, assurance
statement collection, constructor, geometry, inventory selection or project
serialization. No new predicate, migration or persistent project field is needed.
Direct import of the companion is available for evidence inspection and verification.

## Captures

- VERIFIED SOURCE FACT: PDF catalogue observations and database identities.
- STRONG EVIDENCE: bounded threshold, correction, persisted-gap and open-frame interpretations.
- RAW LEGACY VALUE: database dimensional fields, configuration strings,
  correction values, saved option and unevaluated expressions.
- CONFLICT: six unresolved source disagreements/ambiguities.
- UNKNOWN: explicit evidence gaps with no inferred fallback.

Components: 482.20; 482.30 / 482.30-K; 482.26; 482.27; E 3308 / E3308;
E 3307; TZ18; KM530; AP3173; AP3174; TRE 03 / TRE0312 / TRE0315 /
TRE0320 - 2; 482.11; TRE1700 - 1.2; KM344A; KM3441A; KM3442A.
482.23 and 482.25 remain balcony-sash evidence, not door substitutes.
Legacy opening labels are source observations, not handing or hinge rules.

Threshold and closed-frame D0B0 strings remain evidence. `D4B0=0110` versus
`0000` has UNKNOWN meaning. Closed PVC frames are not classified as open frames.
The four expressions `E 3307 = L - 64`, `TZ18 = L * 2`, `482.11 = H - 75`
and `TRE1700 - 1.2 = H - 102` are strings with evaluation disabled; L/H meanings
remain UNKNOWN. There is no expression parser, evaluator or cutting authority.

`dist_u/dist_b/dist_l/dist_r=8`, `Pl=6`, `Assembly_Use_Rabbet=1`,
`ReinfCorr=20` and observed variant values -5 / -4.5 / 7 / 9 remain raw.
Source decimal spelling `-4,5` is preserved separately. None defines overlap,
floor gap, sash clearance or cutting deduction.

Options ID 56 stores the string `10` with comment `DIST2BOTTOM_SAVED`.
Language and schema evidence supports configurable/persisted distance to floor.
Units, precedence and permitted range are UNKNOWN; PRELUDE applicability is
UNRESOLVED. This is not a fixed system default, 10 mm rule or production clearance.

Open-frame labels are retained in English and Bulgarian. Storage representation,
bottom-member omission, leaf-bottom relationship and serialization command/subtype
remain UNKNOWN; P-frame geometry remains UNRESOLVED.

## Separate measurements and conflicts

PDF measurements remain raw printed dimensions, separately from database
`dim_in`, `dim_out`, `profilew`, `profilez`. In particular, PDF 80 versus DB 82
and PDF 56.6 versus DB 56.56 are retained without reconciliation. Zero database
fields do not prove zero physical size. Printed threshold height does not locate
the threshold relative to finished floor. Existing raw catalogue types are retained.

All six conflicts remain UNRESOLVED:

1. AP3173/AP3174: database 60/70mm labels versus PDF door-sash pairing.
2. Frame comments naming 482.20 versus assignments using 482.30-K.
3. 482.27 outward-opening naming/configuration versus DoorOut=0.
4. E3308 threshold naming/assignment versus alprag=0.
5. KM530 occurring outside threshold-only contexts.
6. PDF TRE 03 S=2.0 versus multiple database thickness variants.

The audit encountered MDB memo/overflow errors, including door workoperations,
and empty PIM tables. Source fact means the audited record says this, not that
its construction rule is valid or that the source inventory is exhaustive.

## Validation

Dedicated executable verifier: `node scripts/verify-prelude60-door-evidence01.mjs`.
It loads actual TypeScript data through the existing runtime loader, checks
provenance/digests, canonical inventory non-mutation, dimensions, classifications,
gap non-promotion, unevaluated expressions, conflicts, unknowns and safety flags.
It also checks immutable promotion rejection and absence of runtime consumers.

Required checks: `npm.cmd run lint`, `npm.cmd run build`, the dedicated verifier,
existing catalogue/profile/inventory/glazing/evidence verifiers, and git diff checks.
Verifier PASS establishes the evidence-package contract only, not technical rules.
Execution results (2026-10-03): dedicated verifier PASS, 69 source-linked captures;
lint PASS; TypeScript/Vite build PASS with a chunk-size warning (>500 kB).

Existing checks PASS: concept04a; profile-resolution02a and 02a2;
profile-aware-joint-geometry01, 01a, 01a1; profile-aware-sash-geometry01;
glazing-evidence01 (contract and runtime); evidence-acquisition01a (contract and
runtime); evidence-review01b (contract and runtime); evidence-review01b2-source-locator;
project-foundation02-runtime (57 cases).

Existing check FAIL: profile-resolution02a3 expects uppercase `ТИП МОДУЛ`,
while the unchanged ConstructorShell renders `Тип модул`. Both existing files
match HEAD; this package has no runtime consumers and changes neither file.
This is an existing UI-label/verifier mismatch. It remains reported rather than
changing UI behavior or an unrelated verifier to obtain PASS.

RUNTIME BEHAVIOR CHANGED = NO

AUTOMATIC GEOMETRY = NO

RULES VALIDATED = NO

MACHINE READY = NO

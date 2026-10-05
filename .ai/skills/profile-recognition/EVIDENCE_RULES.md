# Profile Recognition Evidence Rules

Evidence classes:

- `CATALOGUE_VERIFIED`: independently verified primary catalogue/section evidence.
- `DATABASE_VERIFIED`: exact imported database row with source-system provenance.
- `HIGH_CONFIDENCE_MATCH`: converging evidence, not independently catalogue verified.
- `POSSIBLE_MATCH`: plausible but non-unique candidate.
- `UNRESOLVED`: absent, conflicting, locked, or insufficient evidence.

Every record must retain source system, article/profile code, role/subtype, source file, and evidence status where available.

Database evidence is not automatically catalogue truth. `dim_in`, `dim_out`, `profileW`, `profileZ`, `cuttingang`, group fields, and CAD filenames must remain source facts with their original semantics. Missing semantics remain UNKNOWN.

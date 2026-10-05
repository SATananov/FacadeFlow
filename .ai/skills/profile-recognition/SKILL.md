# Profile Recognition Skill

Scope: evidence-only recognition and shortlisting of profile/article records across imported system packages.

Source provenance: imported from `C:\Users\stana\Desktop\UNIVERSAL_PROFILE_JOINT_KNOWLEDGE_01.zip`, originally supplied as a legacy database export. The copied CSV files are evidence records, not catalogue truth.

Safety boundaries:

- AUTOMATIC GEOMETRY = NO
- RULES VALIDATED = NO
- MACHINE READY = NO
- UNKNOWN FACTS MUST REMAIN UNKNOWN

## Reasoning flow

`selected system → exact profile/article code → role/subtype → profileW/profileZ envelope → catalogue/group context → CAD/section evidence → candidate result`

Use the strongest available evidence in that order. A recognition result does not authorize the profile for a product position and does not mutate profile resolution, geometry, or project state.

## Result states

- `CATALOGUE_VERIFIED` — independently checked against an authoritative catalogue or technical drawing.
- `DATABASE_VERIFIED` — exact imported database record, without independent catalogue confirmation.
- `HIGH_CONFIDENCE_MATCH` — multiple independent evidence signals agree, but catalogue verification is still absent.
- `POSSIBLE_MATCH` — candidate fit remains non-unique or incomplete.
- `UNRESOLVED` — evidence is missing, conflicting, locked, or insufficient.

## Prohibitions

- Never identify a profile purely because another profile has similar dimensions.
- Never reinterpret `dim_in` or `dim_out` unless their semantics are explicitly documented by evidence.
- Never use a profile from another system because its dimensions look similar.
- Never infer a production profile relationship from role names alone.
- Never turn recognition into automatic profile selection or product resolution.

The imported system summary covers Altest, Baufen, Profilink16, ProfilinkEN, Schuco, VivaPlast, and WeissProfil2018_113 as accessible evidence packages. PremiumPlast and UIUT-STIL remain `LOCKED / UNRESOLVED` because their database files required an unknown password. Their contents must not be inferred from another system.

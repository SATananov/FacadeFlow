# Joint Knowledge Skill

Scope: evidence-only retrieval of profile-to-profile relationship and joint-rule tokens.

Source provenance: imported from `C:\Users\stana\Desktop\UNIVERSAL_PROFILE_JOINT_KNOWLEDGE_01.zip`, originally supplied as a legacy database export. Tokens are evidence, not machine-ready geometry.

## Reasoning flow

`system + profile A + profile B + role A + role B + orientation/contact side → known relationship evidence`

Return source system, rule/operation identifier, relation token, evidence status, and unresolved geometric fields. Do not mutate geometry or generate a joint.

## Result states

- `CATALOGUE_VERIFIED`
- `DATABASE_RULE_EVIDENCE`
- `POSSIBLE`
- `UNRESOLVED`

## Strict interpretation rules

- A rule name is not physical joint geometry.
- `cuttingang` is preserved as database evidence, not automatically the final joint cut.
- `POS` or runtime/template coordinates are not a notch contour.
- Machine/tool markers remain opaque until independently mapped.
- Missing `standardoperations` does not prove that a system has no joint logic.

AUTOMATIC GEOMETRY = NO. RULES VALIDATED = NO. MACHINE READY = NO. UNKNOWN FACTS MUST REMAIN UNKNOWN.

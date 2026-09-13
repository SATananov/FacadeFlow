# USER FACING LANGUAGE 01 — Project naming and Bulgarian UI

## Goal

Make the current FacadeFlow workflow understandable to a first-time Bulgarian user without exposing internal implementation labels, UUID fragments, development stage names or mixed Bulgarian/English instructions.

## Accepted behavior

- Internal stable Project / Offer / Module / FIELD identities remain unchanged and are not renamed.
- The local project selector no longer exposes UUID fragments. It shows the object name, client name, `Свободен проект` or `Нов проект` as a human-facing label.
- The project command strip explicitly labels the project selector as `Проект`.
- Constructor development-stage labels are removed from visible UI and replaced with user language.
- Primary view controls use Bulgarian labels: `Профилен изглед`, `Мрежа`, `Прилепване`, `Побиране`.
- `SYSTEM NEUTRAL`, raw FIELD IDs and other internal status wording are not shown as normal user guidance.
- FIELD remains the internal/domain term; the Bulgarian UI presents it as `ПОЛЕ`.
- The technical boundary is explained in plain Bulgarian and does not imply production readiness.
- `Ревизии и доказателства` maps internal predicates and revision UUIDs to human-readable labels.
- A recorded unchanged revision is clearly shown as current; the disabled action explains that there are no new changes. A changed draft explicitly offers the next `R` number.
- Confirmation boundaries remain unchanged: a human selection does not prove base-profile compatibility, glazing inset or glass cut.

## Non-goals

- No Project/Offer/Module identity changes.
- No Construction topology changes.
- No revision, evidence, confirmation, persistence or technical-resolution semantics changes.
- No automatic profile, glazing or bead selection.
- No production or machine readiness changes.

## Safety boundary

This is a presentation/wording stage. Existing hidden contract markers may remain for legacy source-contract verifiers, but they are not rendered to the user.

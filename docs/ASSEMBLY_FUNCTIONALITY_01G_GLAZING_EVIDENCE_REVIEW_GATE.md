# ASSEMBLY FUNCTIONALITY 01G — GLAZING EVIDENCE REVIEW GATE

## Goal
Convert 01F gaps into an explicit human-review gate without inventing missing construction knowledge.

01G answers a different question from 01F:
- 01F: what evidence/rule is missing and how many real occurrences does it block?
- 01G: is there any candidate source worth human review, and has anything actually been accepted as reviewed evidence?

## Contract
For every 01F gap, 01G creates exactly one review item.

A review item can be:
- `human-input-required`: the missing item is an operator-controlled input, not a system rule.
- `evidence-required`: no qualified source-bound candidate currently proves the missing rule.
- `reference-candidate`: a reference-derived source exists and is worth human review, but it is NOT accepted evidence.

### Current PRELUDE 60 case
For `482.05 ↔ 482.15 · 24 mm`:
- bead-to-base compatibility: no qualified reviewed candidate is available;
- exact glazing placement: no qualified reviewed candidate is available;
- glass cut: the KMG 60 reference dataset contains a 12 / 12 mm reference correction candidate.

The 12 / 12 reference remains only a candidate because the current source does not prove a reviewed formula, reference basis, direction semantics, scope, or exact cut authority.

## Safety boundaries
REFERENCE CANDIDATE IS NOT REVIEWED EVIDENCE.

A candidate MUST NOT:
- close an 01F gap automatically;
- promote compatibility to reviewed;
- promote placement to reviewed;
- create a production glass-cut rule;
- unlock profile or glazing geometry;
- unlock BOM/machine output.

RULE PROMOTION = NO
AUTOMATIC GEOMETRY = NO
RULES VALIDATED = NO
MACHINE READY = NO

## Acceptance
- 01F gaps remain unchanged and open.
- Review items are one-to-one with the deduplicated gaps.
- The PRELUDE 60 24 mm glass-cut gap exposes the existing KMG 60 12 / 12 reference as a candidate only.
- Bead-base and placement remain without qualified candidate evidence.
- No review item has accepted evidence in 01G.
- No rule or geometry is promoted.

# CLEAN TECHNICAL NODE 01

## Goal

Keep FacadeFlow's own technical-drawing language: the selected joint is the primary visual, participating catalogue profiles are obvious, dimensions read cleanly around the section, and secondary system data stays compact.

## Main view

The joint detail now reads in this order:

1. participating catalogue profiles;
2. FIELD / boundary orientation;
3. the automatic system joint as the dominant technical drawing;
4. catalogue dimensions directly around the section;
5. reviewed visible-face fact and system-rule reference value;
6. compact technical facts panel.

## Dimension provenance

The existing safety distinction remains unchanged:

- catalogue dimensions are catalogue facts;
- reviewed visible-face dimensions remain separate profile facts;
- the system correction remains a reference rule;
- mounting overlap remains UNKNOWN until exact assembly evidence exists.

No visual cleanup is allowed to convert a reference value into a production dimension.

## Scope

This patch is UI / technical-reading cleanup only. It does not alter product topology, component selection, joint rule resolution, BOM readiness, machine readiness, or exact joint evidence.

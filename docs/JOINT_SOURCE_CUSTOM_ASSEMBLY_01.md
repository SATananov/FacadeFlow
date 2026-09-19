# JOINT SOURCE + CUSTOM ASSEMBLY 01

## Goal
Give every reusable joint type an explicit knowledge source and allow a user to create a reusable custom assembly draft from the real profiles of the selected system without pretending that the draft is verified production geometry.

## Source states
FacadeFlow presents four knowledge states for a joint type:
- Factory verified — only when reviewed exact-profile-pair evidence already exists.
- Company confirmed — reserved for a later explicit expert-review workflow.
- Custom draft — user-created visual assembly draft stored in the local FacadeFlow joint library.
- Undefined — no exact joint source is registered.

## Custom assembly workspace
For a resolved profile pair, the user can open a separate workspace with the real catalogue profile sections. The support profile and sash can be dragged, nudged, and rotated by 90 degrees. A title, source note, and review note can be stored with the draft.

The workspace coordinates are deliberately UI coordinates, not millimetres. They are never interpreted as overlap, inset, cut length, or machine geometry.

## Persistence
Custom drafts are stored under `facadeflow.customJointLibrary.v1` in the application local storage and keyed by the system-driven joint library key. This makes one draft reusable by every occurrence of the same joint type.

## Safety boundary
Saving a custom draft does not:
- change `jointAssemblyEvidence`;
- change `geometryStatus` to available;
- mark the joint factory-verified or company-confirmed;
- unlock BOM, quotation, production, or machine output.

Exact geometry still requires a separate reviewed evidence workflow.

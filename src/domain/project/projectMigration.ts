import type { PF01Snapshot, ProjectSnapshot } from './projectModel'
import { emptyAssurance } from '../assurance/assuranceModel'
import { trackChanges } from '../assurance/changeTracking'
import { synchronizeEvidence } from '../assurance/legacyEvidenceAdapter'
/** Called only after PF01 shape/ownership validation. No inferred actor, edition or confirmation. */
export function migratePF01Snapshot(legacy: PF01Snapshot): ProjectSnapshot {
  const snapshot: ProjectSnapshot = { ...structuredClone(legacy), schemaVersion: 'project-foundation-02',
    revisions: { headRevisionId: null, revisionsById: {} }, assurance: emptyAssurance() }
  trackChanges(null, snapshot)
  synchronizeEvidence(snapshot)
  return snapshot
}

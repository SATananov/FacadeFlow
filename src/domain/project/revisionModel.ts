import type { ProjectSnapshot, ProjectOffer } from './projectModel'
import type { ChangeKey, HumanActor } from '../assurance/assuranceModel'
export type RecordedOffer = Extract<ProjectOffer, { entryMode: 'free' }> |
  Omit<Extract<ProjectOffer, { entryMode: 'offer' }>, 'setupStage' | 'pendingCopyModuleId' | 'fromFreeSketch'>
export type RevisionContent = Pick<ProjectSnapshot,
  'project' | 'modulesById' | 'constructionDraftsByModuleId' | 'profileResolutionsByModuleId'> & {
    offersById: Record<string, RecordedOffer>
    evidenceByStatementKey: Record<string, string>
    changeGenerations: Record<ChangeKey, number>
  }
export type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T
export type ProjectRevision = DeepReadonly<{
  id: string; projectId: string; number: number; parentRevisionId: string | null
  recordedAt: string; recordedBy: HumanActor; contentSchemaVersion: 'project-revision-02'
  contentDigest: string; content: RevisionContent
}>
export type RevisionState = { headRevisionId: string | null; revisionsById: Record<string, ProjectRevision> }

export const CUSTOM_JOINT_LIBRARY_VERSION = 'custom-joint-library-01' as const
export const CUSTOM_JOINT_LIBRARY_STORAGE_KEY = 'facadeflow.customJointLibrary.v1'

export type JointKnowledgeStatus =
  | 'undefined'
  | 'custom-draft'
  | 'company-confirmed'
  | 'factory-verified'

export type CustomJointWorkspacePose = Readonly<{
  x: number
  y: number
  rotationDeg: number
}>

// MANUAL ASSEMBLY PUZZLE 01
// A puzzle piece is deliberately presentation-only. It stores how a catalogue
// section was arranged by the human in the manual workspace. It is NOT a
// production mate, measured offset, machining coordinate, overlap or inset.
export type CustomJointPuzzlePiece = Readonly<{
  id: string
  profileCode: string
  pose: CustomJointWorkspacePose
  flipX: boolean
  locked: boolean
}>

export type CustomJointDraft = Readonly<{
  version: typeof CUSTOM_JOINT_LIBRARY_VERSION
  id: string
  libraryKey: string
  systemId: string
  jointKind: string
  supportProfileCode: string
  sashProfileCode: string
  title: string
  note: string
  sourceNote: string
  status: 'custom-draft'
  supportPose: CustomJointWorkspacePose
  sashPose: CustomJointWorkspacePose
  /**
   * Optional for backward compatibility with drafts created before
   * MANUAL ASSEMBLY PUZZLE 01. When absent, the UI reconstructs the legacy
   * support + sash pair from supportPose / sashPose.
   */
  puzzlePieces?: readonly CustomJointPuzzlePiece[]
  createdAtIso: string
  updatedAtIso: string
}>

export type CustomJointLibrarySnapshot = Readonly<{
  version: typeof CUSTOM_JOINT_LIBRARY_VERSION
  drafts: Readonly<Record<string, CustomJointDraft>>
}>

const EMPTY_LIBRARY: CustomJointLibrarySnapshot = {
  version: CUSTOM_JOINT_LIBRARY_VERSION,
  drafts: {},
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isFinitePose(value: unknown): value is CustomJointWorkspacePose {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<CustomJointWorkspacePose>
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y) && Number.isFinite(candidate.rotationDeg)
}

function isPuzzlePiece(value: unknown): value is CustomJointPuzzlePiece {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<CustomJointPuzzlePiece>
  return typeof candidate.id === 'string'
    && typeof candidate.profileCode === 'string'
    && typeof candidate.flipX === 'boolean'
    && typeof candidate.locked === 'boolean'
    && isFinitePose(candidate.pose)
}

function isDraft(value: unknown): value is CustomJointDraft {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<CustomJointDraft>
  const puzzlePiecesValid = candidate.puzzlePieces === undefined
    || (Array.isArray(candidate.puzzlePieces) && candidate.puzzlePieces.every(isPuzzlePiece))

  return candidate.version === CUSTOM_JOINT_LIBRARY_VERSION
    && typeof candidate.id === 'string'
    && typeof candidate.libraryKey === 'string'
    && typeof candidate.systemId === 'string'
    && typeof candidate.jointKind === 'string'
    && typeof candidate.supportProfileCode === 'string'
    && typeof candidate.sashProfileCode === 'string'
    && candidate.status === 'custom-draft'
    && typeof candidate.title === 'string'
    && typeof candidate.note === 'string'
    && typeof candidate.sourceNote === 'string'
    && typeof candidate.createdAtIso === 'string'
    && typeof candidate.updatedAtIso === 'string'
    && isFinitePose(candidate.supportPose)
    && isFinitePose(candidate.sashPose)
    && puzzlePiecesValid
}

export function readCustomJointLibrary(): CustomJointLibrarySnapshot {
  if (!canUseStorage()) return EMPTY_LIBRARY
  try {
    const raw = window.localStorage.getItem(CUSTOM_JOINT_LIBRARY_STORAGE_KEY)
    if (!raw) return EMPTY_LIBRARY
    const parsed = JSON.parse(raw) as { version?: unknown; drafts?: unknown }
    if (parsed.version !== CUSTOM_JOINT_LIBRARY_VERSION || !parsed.drafts || typeof parsed.drafts !== 'object') {
      return EMPTY_LIBRARY
    }
    const drafts: Record<string, CustomJointDraft> = {}
    for (const [key, value] of Object.entries(parsed.drafts)) {
      if (isDraft(value) && value.libraryKey === key) drafts[key] = value
    }
    return { version: CUSTOM_JOINT_LIBRARY_VERSION, drafts }
  } catch {
    return EMPTY_LIBRARY
  }
}

function writeCustomJointLibrary(snapshot: CustomJointLibrarySnapshot): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(CUSTOM_JOINT_LIBRARY_STORAGE_KEY, JSON.stringify(snapshot))
}

export function getCustomJointDraft(libraryKey: string | null | undefined): CustomJointDraft | null {
  if (!libraryKey) return null
  return readCustomJointLibrary().drafts[libraryKey] ?? null
}

export function createDefaultCustomJointDraft(args: {
  libraryKey: string
  systemId: string
  jointKind: string
  supportProfileCode: string
  sashProfileCode: string
}): CustomJointDraft {
  const now = new Date().toISOString()
  const supportPose: CustomJointWorkspacePose = { x: 310, y: 310, rotationDeg: 0 }
  const sashPose: CustomJointWorkspacePose = { x: 575, y: 310, rotationDeg: 0 }
  return {
    version: CUSTOM_JOINT_LIBRARY_VERSION,
    id: `custom-joint:${args.libraryKey}`,
    libraryKey: args.libraryKey,
    systemId: args.systemId,
    jointKind: args.jointKind,
    supportProfileCode: args.supportProfileCode,
    sashProfileCode: args.sashProfileCode,
    title: `${args.supportProfileCode} ↔ ${args.sashProfileCode}`,
    note: '',
    sourceNote: '',
    status: 'custom-draft',
    supportPose,
    sashPose,
    puzzlePieces: [
      { id: 'support', profileCode: args.supportProfileCode, pose: supportPose, flipX: false, locked: false },
      { id: 'sash', profileCode: args.sashProfileCode, pose: sashPose, flipX: false, locked: false },
    ],
    createdAtIso: now,
    updatedAtIso: now,
  }
}

export function getCustomJointPuzzlePieces(draft: CustomJointDraft): readonly CustomJointPuzzlePiece[] {
  if (draft.puzzlePieces && draft.puzzlePieces.length > 0) return draft.puzzlePieces
  return [
    { id: 'support', profileCode: draft.supportProfileCode, pose: draft.supportPose, flipX: false, locked: false },
    { id: 'sash', profileCode: draft.sashProfileCode, pose: draft.sashPose, flipX: false, locked: false },
  ]
}

export function saveCustomJointDraft(draft: CustomJointDraft): CustomJointDraft {
  const current = readCustomJointLibrary()
  const nextDraft: CustomJointDraft = {
    ...draft,
    version: CUSTOM_JOINT_LIBRARY_VERSION,
    status: 'custom-draft',
    updatedAtIso: new Date().toISOString(),
  }
  writeCustomJointLibrary({
    version: CUSTOM_JOINT_LIBRARY_VERSION,
    drafts: { ...current.drafts, [draft.libraryKey]: nextDraft },
  })
  return nextDraft
}

export function deleteCustomJointDraft(libraryKey: string): void {
  const current = readCustomJointLibrary()
  if (!current.drafts[libraryKey]) return
  const drafts = { ...current.drafts }
  delete drafts[libraryKey]
  writeCustomJointLibrary({ version: CUSTOM_JOINT_LIBRARY_VERSION, drafts })
}

export function resolveJointKnowledgeStatus(args: {
  exactGeometryVerified: boolean
  customDraft: CustomJointDraft | null
}): JointKnowledgeStatus {
  if (args.exactGeometryVerified) return 'factory-verified'
  if (args.customDraft) return 'custom-draft'
  return 'undefined'
}

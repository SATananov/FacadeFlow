import type { ProfileRole } from './types'

export type OperatorWorkingProfileDimensions = Readonly<{
  systemId: string
  profileCode: string
  role: Extract<ProfileRole, 'frame' | 'mullion' | 'sash' | 'door-sash'>
  systemDepthMm: number
  sectionHeightMm: number
  visibleWidthMm: number
  internalZoneTotalMm: number
  sourceStatus: 'human-reviewed-working-dimension'
  noteBg: string
}>

/**
 * OPERATOR WORKFLOW 01 — explicit working dimensions for the sketch layer.
 *
 * These values describe the profile itself. They are intentionally separate
 * from joint overlap / glazing inset / glass cut rules. In particular,
 * sectionHeightMm - visibleWidthMm is stored as an internal profile zone and
 * MUST NOT be promoted to a joint overlap automatically.
 *
 * PRELUDE 60 working sheet supplied and reviewed by the user:
 * - 482.30 frame:   system depth 60, section height 64, visible width 42
 * - 482.21 mullion: system depth 60, section height 84, visible width 40
 * - 482.05 sash:    system depth 60, section height 78, visible width 56
 * - 482.18 sash:    system depth 60, section height 78, visible width 56
 */
const prelude60WorkingDimensions: readonly OperatorWorkingProfileDimensions[] = [
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.30',
    role: 'frame',
    systemDepthMm: 60,
    sectionHeightMm: 64,
    visibleWidthMm: 42,
    internalZoneTotalMm: 22,
    sourceStatus: 'human-reviewed-working-dimension',
    noteBg: 'Каса 482.30: 64 mm общ размер, 42 mm видима ширина, 22 mm вътрешна профилна зона.',
  },
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.21',
    role: 'mullion',
    systemDepthMm: 60,
    sectionHeightMm: 84,
    visibleWidthMm: 40,
    internalZoneTotalMm: 44,
    sourceStatus: 'human-reviewed-working-dimension',
    noteBg: 'Делител 482.21: 84 mm общ размер, 40 mm видима ширина, 44 mm обща вътрешна профилна зона. Не се дели автоматично на две монтажни застъпвания.',
  },
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.05',
    role: 'sash',
    systemDepthMm: 60,
    sectionHeightMm: 78,
    visibleWidthMm: 56,
    internalZoneTotalMm: 22,
    sourceStatus: 'human-reviewed-working-dimension',
    noteBg: 'Крило 482.05: 78 mm общ размер, 56 mm видима ширина, 22 mm зона общ размер − видима ширина.',
  },
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.18',
    role: 'sash',
    systemDepthMm: 60,
    sectionHeightMm: 78,
    visibleWidthMm: 56,
    internalZoneTotalMm: 22,
    sourceStatus: 'human-reviewed-working-dimension',
    noteBg: 'Крило 482.18: 78 mm общ размер, 56 mm видима ширина, 22 mm зона общ размер − видима ширина. Използва се за операторската скица на каталожно потвърдената двойка 482.21 + 482.18.',
  },
]

export function getOperatorWorkingProfileDimensions(
  systemId: string | null | undefined,
  profileCode: string | null | undefined,
): OperatorWorkingProfileDimensions | null {
  if (!systemId || !profileCode) return null
  return prelude60WorkingDimensions.find(
    (entry) => entry.systemId === systemId && entry.profileCode === profileCode,
  ) ?? null
}

export function listOperatorWorkingProfileDimensions(systemId: string): readonly OperatorWorkingProfileDimensions[] {
  return prelude60WorkingDimensions.filter((entry) => entry.systemId === systemId)
}

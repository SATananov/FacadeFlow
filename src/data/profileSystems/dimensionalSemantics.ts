import type { ProfileRole } from './types'

export type ProfileSemanticSource = 'human-confirmed' | 'system-nominal'

export type SemanticDimension = {
  valueMm: number
  source: ProfileSemanticSource
  noteBg: string
}

export type ProfileDimensionalSemantics = {
  systemId: string
  profileCode: string
  role: ProfileRole
  constructionDepth?: SemanticDimension
  visibleFace?: SemanticDimension
  sashOverlap?: SemanticDimension
  glazingInset?: SemanticDimension
}

/**
 * PROFILE RESOLUTION 01B — reviewed dimensional semantics only.
 *
 * Raw catalogue callouts remain raw in the catalogue. Nothing is inferred here
 * from array position or from "the smaller/larger number". A value enters this
 * registry only after it has an explicit semantic meaning.
 *
 * PRELUDE 60 currently has two human-confirmed visible-face values from the
 * working profile notes:
 *   482.30 frame   -> 42 mm visible face
 *   482.21 mullion -> 40 mm visible face
 *
 * Sash geometry is deliberately unresolved. The sash measurement convention
 * was explicitly flagged as special and must be confirmed before overlap,
 * visible sash face or glazing deductions are allowed.
 */
export const profileDimensionalSemantics: readonly ProfileDimensionalSemantics[] = [
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.30',
    role: 'frame',
    constructionDepth: {
      valueMm: 60,
      source: 'system-nominal',
      noteBg: 'Номинална системна дълбочина PRELUDE 60.',
    },
    visibleFace: {
      valueMm: 42,
      source: 'human-confirmed',
      noteBg: 'Human-confirmed работна семантика: видима височина/лице на каса 482.30.',
    },
  },
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.21',
    role: 'mullion',
    constructionDepth: {
      valueMm: 60,
      source: 'system-nominal',
      noteBg: 'Номинална системна дълбочина PRELUDE 60.',
    },
    visibleFace: {
      valueMm: 40,
      source: 'human-confirmed',
      noteBg: 'Human-confirmed работна семантика: видима височина/лице на делител 482.21.',
    },
  },
]

export function getProfileDimensionalSemantics(
  systemId: string,
  profileCode: string,
): ProfileDimensionalSemantics | undefined {
  return profileDimensionalSemantics.find(
    (entry) => entry.systemId === systemId && entry.profileCode === profileCode,
  )
}

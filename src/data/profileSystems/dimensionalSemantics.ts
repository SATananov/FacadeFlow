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
 * The current PRELUDE 60 system catalogue records 482.05 as
 * 60 / 78 / 56 mm. The 56 mm visible face is reviewed for the operator sketch;
 * 482.18 is also reviewed at 60 / 78 / 56 mm for the catalogue-confirmed
 * 482.21 + 482.18 sectional pairing. 78 - 56 = 22 mm is a profile-side zone, not an automatic joint overlap,
 * glazing inset, glass cut or machining rule.
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
    profileCode: '482.05',
    role: 'sash',
    constructionDepth: {
      valueMm: 60,
      source: 'system-nominal',
      noteBg: 'Номинална системна дълбочина PRELUDE 60.',
    },
    visibleFace: {
      valueMm: 56,
      source: 'human-confirmed',
      noteBg: 'Прегледана работна семантика: 482.05 има 78 mm общ размер и 56 mm видима ширина.',
    },
  },
  {
    systemId: 'kmg-prelude-60',
    profileCode: '482.18',
    role: 'sash',
    constructionDepth: {
      valueMm: 60,
      source: 'system-nominal',
      noteBg: 'Номинална системна дълбочина PRELUDE 60.',
    },
    visibleFace: {
      valueMm: 56,
      source: 'human-confirmed',
      noteBg: 'Прегледана работна семантика: 482.18 има 78 mm общ размер и 56 mm видима ширина в актуалния PRELUDE 60 каталог.',
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

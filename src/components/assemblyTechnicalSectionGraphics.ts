import frame48230Image from '../assets/catalog/prelude60/prelude60-48230-frame-clean.png'
import sash48205Image from '../assets/catalog/prelude60/prelude60-48205-sash-clean.png'
import sash48218Image from '../assets/catalog/prelude60/prelude60-48218-sash-clean.png'
import mullion48221Image from '../assets/catalog/prelude60/prelude60-48221-mullion-clean.png'
import frame48230AssemblyImage from '../assets/catalog/prelude60/prelude60-48230-frame-assembly.png'
import sash48205AssemblyImage from '../assets/catalog/prelude60/prelude60-48205-sash-assembly.png'
import mullion48221AssemblyImage from '../assets/catalog/prelude60/prelude60-48221-mullion-assembly.png'
import bead48215AssemblyImage from '../assets/catalog/prelude60/prelude60-48215-bead-clean.png'
import bead48215CatalogueImage from '../assets/catalog/prelude60/prelude60-48215-bead-catalogue.png'
import type { TechnicalProfileSection, TechnicalSectionGraphicKey } from '../data/profileSystems/technicalSections'

export type TechnicalSectionGraphic = Readonly<{
  src: string
  width: number
  height: number
  label: string
}>

type GraphicPair = Readonly<{
  catalogue: Readonly<{ src: string; width: number; height: number }>
  assembly: Readonly<{ src: string; width: number; height: number }>
}>

const graphics: Readonly<Record<TechnicalSectionGraphicKey, GraphicPair>> = {
  'prelude60-frame-48230': {
    catalogue: { src: frame48230Image, width: 180, height: 192 },
    assembly: { src: frame48230AssemblyImage, width: 180, height: 192 },
  },
  'prelude60-mullion-48221': {
    catalogue: { src: mullion48221Image, width: 180, height: 252 },
    assembly: { src: mullion48221AssemblyImage, width: 180, height: 252 },
  },
  'prelude60-sash-48205': {
    catalogue: { src: sash48205Image, width: 180, height: 168 },
    assembly: { src: sash48205AssemblyImage, width: 180, height: 168 },
  },
  'prelude60-sash-48218': {
    catalogue: { src: sash48218Image, width: 182, height: 236 },
    assembly: { src: sash48218Image, width: 182, height: 236 },
  },
  'prelude60-glass-bead-48215': {
    // Operator card: use the actual PRELUDE catalogue presentation with
    // 28.5 / 22 / 16.5 dimensions so this compact component is not mistaken
    // for a full-size frame/sash profile.
    catalogue: { src: bead48215CatalogueImage, width: 180, height: 210 },
    // Final assembly: keep the clean contour only.
    assembly: { src: bead48215AssemblyImage, width: 59, height: 76 },
  },
}

function graphicFor(
  section: TechnicalProfileSection | null,
  kind: 'catalogue' | 'assembly',
  fallbackLabel: string,
): TechnicalSectionGraphic | null {
  if (!section) return null
  const graphic = graphics[section.graphicKey][kind]
  return {
    ...graphic,
    label: `${fallbackLabel} ${section.profileCode}`,
  }
}

export function getCatalogueTechnicalSectionGraphic(
  section: TechnicalProfileSection | null,
  fallbackLabel: string,
): TechnicalSectionGraphic | null {
  return graphicFor(section, 'catalogue', fallbackLabel)
}

export function getAssemblyTechnicalSectionGraphic(
  section: TechnicalProfileSection | null,
  fallbackLabel: string,
): TechnicalSectionGraphic | null {
  return graphicFor(section, 'assembly', fallbackLabel)
}

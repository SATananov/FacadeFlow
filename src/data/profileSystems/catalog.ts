import { kmgPrelude60 } from './prelude60'
import { kmgPrestige70, kmgPrestigePlus70 } from './prestige70'
import { vivaPlast } from './vivaplast'
import { profilink16 } from './profilink16'
import type { ProfileSystemCatalogEntry } from './types'

export const profileSystemCatalog: readonly ProfileSystemCatalogEntry[] = [
  kmgPrelude60,
  kmgPrestige70,
  kmgPrestigePlus70,
  vivaPlast,
  profilink16,
]

export type ProfileSystemId = (typeof profileSystemCatalog)[number]['id']

export function getProfileSystemById(id: string): ProfileSystemCatalogEntry | undefined {
  return profileSystemCatalog.find((system) => system.id === id)
}

export function getSelectableProfileSystems(): readonly ProfileSystemCatalogEntry[] {
  return profileSystemCatalog.filter((system) => system.selectable)
}

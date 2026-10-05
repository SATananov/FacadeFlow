import type { ProfileSystemCatalogEntry } from './types'

const sourcePath = '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv'
const importedEvidence = (profileCode: string) => ({
  documentTitle: sourcePath,
  page: 0,
  section: `VivaPlast imported structural profile ${profileCode}`,
  note: 'The source CSV does not provide a catalogue page; no page or geometry is inferred.',
})

export const vivaPlast: ProfileSystemCatalogEntry = {
  id: 'vivaplast',
  manufacturer: 'VivaPlast',
  name: 'Imported structural profiles',
  family: 'UNKNOWN',
  material: 'OTHER',
  nominalDepthMm: 0,
  selectable: true,
  sourceStatus: 'database-imported',
  mainProfiles: [
    {
      code: 'ГОЛ.КАСА 5522',
      role: 'frame',
      labelBg: 'Каса',
      labelCatalog: 'frame',
      evidence: importedEvidence('ГОЛ.КАСА 5522'),
    },
    {
      code: 'ВРАТА Т 3к63070',
      role: 'sash',
      labelBg: 'Крило',
      labelCatalog: 'sash',
      evidence: importedEvidence('ВРАТА Т 3к63070'),
    },
    {
      code: 'ДЕЛ.ГОЛЯМ 5523',
      role: 'mullion',
      labelBg: 'Делител',
      labelCatalog: 'mullion',
      evidence: importedEvidence('ДЕЛ.ГОЛЯМ 5523'),
    },
  ],
  glassBeads: [],
  additionalProfiles: [],
  gaskets: [],
  panelsAndSills: [],
  reinforcements: [],
  accessories: [],
  evidence: [
    {
      documentTitle: sourcePath,
      page: 0,
      section: 'VivaPlast structural profile records',
      note: 'Imported database evidence only; dimensions, joints, and manufacturing semantics remain unresolved.',
    },
  ],
}

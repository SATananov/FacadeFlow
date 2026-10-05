import type { ProfileSystemCatalogEntry } from './types'

const sourcePath = '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv'
const importedEvidence = (profileCode: string) => ({
  documentTitle: sourcePath,
  page: 0,
  section: `Schuco imported structural profile ${profileCode}`,
  note: 'The source CSV does not provide a catalogue page; no page or geometry is inferred.',
})

export const schuco: ProfileSystemCatalogEntry = {
  id: 'schuco',
  manufacturer: 'Schuco',
  name: 'Imported structural profiles',
  family: 'UNKNOWN',
  material: 'OTHER',
  nominalDepthMm: 0,
  selectable: true,
  sourceStatus: 'database-imported',
  mainProfiles: [
    {
      code: 'SCH 19411',
      role: 'frame',
      labelBg: 'Каса',
      labelCatalog: 'frame',
      evidence: importedEvidence('SCH 19411'),
    },
    {
      code: 'SCH 19431',
      role: 'sash',
      labelBg: 'Крило',
      labelCatalog: 'sash',
      evidence: importedEvidence('SCH 19431'),
    },
    {
      code: 'SCH 19460',
      role: 'mullion',
      labelBg: 'Делител',
      labelCatalog: 'mullion',
      evidence: importedEvidence('SCH 19460'),
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
      section: 'Schuco structural profile records',
      note: 'Imported database evidence only; dimensions, joints, and manufacturing semantics remain unresolved.',
    },
  ],
}

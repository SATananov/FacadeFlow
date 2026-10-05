import type { ProfileSystemCatalogEntry } from './types'

const sourcePath = '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv'
const importedEvidence = (profileCode: string) => ({
  documentTitle: sourcePath,
  page: 0,
  section: `Baufen imported structural profile ${profileCode}`,
  note: 'The source CSV does not provide a catalogue page; no page or geometry is inferred.',
})

export const baufen: ProfileSystemCatalogEntry = {
  id: 'baufen',
  manufacturer: 'Baufen',
  name: 'Imported structural profiles',
  family: 'UNKNOWN',
  material: 'OTHER',
  nominalDepthMm: 0,
  selectable: true,
  sourceStatus: 'database-imported',
  mainProfiles: [
    {
      code: '1607',
      role: 'frame',
      labelBg: 'Каса',
      labelCatalog: 'frame',
      evidence: importedEvidence('1607'),
    },
    {
      code: '1608',
      role: 'sash',
      labelBg: 'Крило',
      labelCatalog: 'sash',
      evidence: importedEvidence('1608'),
    },
    {
      code: '1632',
      role: 'mullion',
      labelBg: 'Делител',
      labelCatalog: 'mullion',
      evidence: importedEvidence('1632'),
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
      section: 'Baufen structural profile records',
      note: 'Imported database evidence only; dimensions, joints, and manufacturing semantics remain unresolved.',
    },
  ],
}

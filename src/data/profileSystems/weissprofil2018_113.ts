import type { ProfileSystemCatalogEntry } from './types'

const sourcePath = '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv'
const importedEvidence = (profileCode: string) => ({
  documentTitle: sourcePath,
  page: 0,
  section: `WeissProfil2018_113 imported structural profile ${profileCode}`,
  note: 'The source CSV does not provide a catalogue page; no page or geometry is inferred.',
})

export const weissProfil2018_113: ProfileSystemCatalogEntry = {
  id: 'weissprofil2018-113',
  manufacturer: 'WeissProfil2018_113',
  name: 'GR C-WP 5000/4000 imported structural profiles',
  family: 'GR C-WP 5000/4000',
  material: 'OTHER',
  nominalDepthMm: 0,
  selectable: true,
  sourceStatus: 'database-imported',
  mainProfiles: [
    {
      code: '3001',
      role: 'frame',
      labelBg: 'Каса',
      labelCatalog: 'frame',
      evidence: importedEvidence('3001'),
    },
    {
      code: '3002',
      role: 'sash',
      labelBg: 'Крило',
      labelCatalog: 'sash',
      evidence: importedEvidence('3002'),
    },
    {
      code: '3003',
      role: 'mullion',
      labelBg: 'Делител',
      labelCatalog: 'mullion',
      evidence: importedEvidence('3003'),
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
      section: 'WeissProfil2018_113 GR C-WP 5000/4000 structural profile records',
      note: 'Only the selected structural subset is runtime-mapped; assembly formulas and joint geometry remain unresolved.',
    },
  ],
}

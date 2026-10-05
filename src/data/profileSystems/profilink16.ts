import type { ProfileSystemCatalogEntry } from './types'

const sourcePath = '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv'
const importedEvidence = (profileCode: string) => ({
  documentTitle: sourcePath,
  page: 0,
  section: `Profilink16 imported structural profile ${profileCode}`,
  note: 'The source CSV does not provide a catalogue page; no page or geometry is inferred.',
})

export const profilink16: ProfileSystemCatalogEntry = {
  id: 'profilink16',
  manufacturer: 'Profilink16',
  name: 'Imported structural profiles',
  family: 'UNKNOWN',
  material: 'OTHER',
  nominalDepthMm: 0,
  selectable: true,
  sourceStatus: 'database-imported',
  mainProfiles: [
    {
      code: '1330000056',
      role: 'frame',
      labelBg: 'Каса',
      labelCatalog: 'frame',
      evidence: importedEvidence('1330000056'),
    },
    {
      code: '130000049',
      role: 'sash',
      labelBg: 'Крило',
      labelCatalog: 'sash',
      evidence: importedEvidence('130000049'),
    },
    {
      code: '311007',
      role: 'mullion',
      labelBg: 'Делител',
      labelCatalog: 'mullion',
      evidence: importedEvidence('311007'),
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
      section: 'Profilink16 structural profile records',
      note: 'Imported database evidence only; dimensions, joints, and manufacturing semantics remain unresolved.',
    },
  ],
}

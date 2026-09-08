import type { ProfileSystemCatalogEntry } from './types'

const source = 'KMG PVC Profiles Systems'

const prestigeSharedGlassBeads: ProfileSystemCatalogEntry['glassBeads'] = [
  { code: '482.14', role: 'glass-bead', labelBg: 'Стъклодържател 14 mm', labelCatalog: 'glass bead 14mm', statedGlassMm: 14, dimensions: { calloutsMm: [36.5, 28.5, 22] }, evidence: { documentTitle: source, page: 4, section: 'Glass beads' } },
  { code: '549.10', role: 'glass-bead', labelBg: 'Стъклодържател 24 mm', labelCatalog: 'glass bead 24mm', statedGlassMm: 24, dimensions: { calloutsMm: [26.5, 28.5, 22] }, evidence: { documentTitle: source, page: 4, section: 'Glass beads' } },
  { code: '482.15', role: 'glass-bead', labelBg: 'Стъклодържател 34 mm', labelCatalog: 'glass bead 34mm', statedGlassMm: 34, dimensions: { calloutsMm: [16.5, 28.5, 22] }, evidence: { documentTitle: source, page: 4, section: 'Glass beads' } },
  { code: '482.01', role: 'glass-bead', labelBg: 'Стъклодържател 34 mm', labelCatalog: 'glass bead 34mm', statedGlassMm: 34, dimensions: { calloutsMm: [16.5, 28.5, 22] }, evidence: { documentTitle: source, page: 4, section: 'Glass beads' } },
  { code: '482.22', role: 'glass-bead', labelBg: 'Стъклодържател 42 mm', labelCatalog: 'glass bead 42mm', statedGlassMm: 42, dimensions: { calloutsMm: [9, 28.5, 22] }, evidence: { documentTitle: source, page: 4, section: 'Glass beads' } },
]

const prestigeSharedAdditionalProfiles: ProfileSystemCatalogEntry['additionalProfiles'] = [
  { code: '549.08', role: 'additional-profile', labelBg: 'Колона за 90° ъгъл', labelCatalog: 'column for 90° angle', dimensions: { calloutsMm: [71, 71] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: '549.07', role: 'additional-profile', labelBg: 'Тръба', labelCatalog: 'pipe', dimensions: { calloutsMm: [70, 48.9] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: '549.06', role: 'additional-profile', labelBg: 'Добавка за тръба', labelCatalog: 'addition for pipe', dimensions: { calloutsMm: [70, 37.3, 24.9] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: '549.14', role: 'additional-profile', labelBg: 'Разширител за каса', labelCatalog: 'frame extension', dimensions: { calloutsMm: [70, 35] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: '549.18', role: 'additional-profile', labelBg: 'Съединителен профил', labelCatalog: 'coupling profile', dimensions: { calloutsMm: [37.2, 13.4] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: '549.09', role: 'additional-profile', labelBg: 'Подложен профил', labelCatalog: 'lift profile', dimensions: { calloutsMm: [26, 36.7] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: '04.860', role: 'additional-profile', labelBg: 'Кант', labelCatalog: 'edge', dimensions: { calloutsMm: [50, 18, 7.5] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: '549.13', role: 'additional-profile', labelBg: 'Компенсатор', labelCatalog: 'compensator', dimensions: { calloutsMm: [18.2, 10.5] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: 'E 3311', role: 'additional-profile', labelBg: 'Алуминиев четков профил', labelCatalog: 'aluminium brush profile', dimensions: { calloutsMm: [58, 24.3] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: 'E 3309', role: 'additional-profile', labelBg: 'Алуминиев праг', labelCatalog: 'aluminium threshold', dimensions: { calloutsMm: [75, 25] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
  { code: 'E 3310', role: 'additional-profile', labelBg: 'Алуминиев профил', labelCatalog: 'aluminium profile', dimensions: { calloutsMm: [20.9, 9] }, evidence: { documentTitle: source, page: 4, section: 'Additional profiles' } },
]

const prestigeSharedGaskets: ProfileSystemCatalogEntry['gaskets'] = [
  { code: 'PAR-02', role: 'gasket', labelBg: 'EPDM уплътнение PAR-02', labelCatalog: 'EPDM gasket PAR-02', evidence: { documentTitle: source, page: 4, section: 'EPDM gaskets' } },
  { code: 'ALT-04', role: 'gasket', labelBg: 'EPDM уплътнение ALT-04', labelCatalog: 'EPDM gasket ALT-04', evidence: { documentTitle: source, page: 4, section: 'EPDM gaskets' } },
]

const prestigeSharedPanels: ProfileSystemCatalogEntry['panelsAndSills'] = [
  { code: '04.844', role: 'panel', labelBg: 'PVC панел', labelCatalog: 'PVC panel', dimensions: { calloutsMm: [100, 20] }, evidence: { documentTitle: source, page: 5, section: 'PVC panels and sills' } },
  { code: '04.843', role: 'panel', labelBg: 'PVC панел', labelCatalog: 'PVC panel', dimensions: { calloutsMm: [100, 24] }, evidence: { documentTitle: source, page: 5, section: 'PVC panels and sills' } },
  { code: '04.846', role: 'sill', labelBg: 'PVC перваз 200 mm', labelCatalog: 'sill', dimensions: { calloutsMm: [200, 27, 20] }, evidence: { documentTitle: source, page: 5, section: 'PVC panels and sills' } },
  { code: '04.847', role: 'sill', labelBg: 'PVC перваз 250 mm', labelCatalog: 'sill', dimensions: { calloutsMm: [250, 27, 20] }, evidence: { documentTitle: source, page: 5, section: 'PVC panels and sills' } },
]

const prestigeSharedReinforcements: ProfileSystemCatalogEntry['reinforcements'] = [
  { code: 'TRE 01', thicknessOptionsMm: [1.0], appliesToProfileCodes: ['549.01', '549.02', '549.12', '549.15', '549.16', '549.19'], dimensions: { calloutsMm: [28.5, 26] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' }, note: 'Catalogue also shows TRE 01 variant with S=0.8/1.2/1.5/2.0 mm.' },
  { code: 'TRE 01', thicknessOptionsMm: [0.8, 1.2, 1.5, 2.0], appliesToProfileCodes: ['549.01', '549.02', '549.12', '549.15', '549.16', '549.19'], dimensions: { calloutsMm: [28.5, 26] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' } },
  { code: 'TRE 02-70', thicknessOptionsMm: [1.2, 1.5, 2.0], appliesToProfileCodes: ['549.03', '549.17'], dimensions: { calloutsMm: [24, 30] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' } },
  { code: 'TRE 07', thicknessOptionsMm: [2.0], appliesToProfileCodes: ['549.05', '549.11'], dimensions: { calloutsMm: [31, 57, 60] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' } },
  { code: 'TRE 09', thicknessOptionsMm: [1.5], appliesToProfileCodes: ['549.04'], dimensions: { calloutsMm: [23.5, 26, 22] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' } },
  { code: 'TRE 10', thicknessOptionsMm: [1.2], appliesToProfileCodes: ['549.07'], dimensions: { calloutsMm: [48] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' } },
  { code: 'TRE 11', thicknessOptionsMm: [1.5], appliesToProfileCodes: ['549.08'], dimensions: { calloutsMm: [40, 40] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' } },
  { code: 'TRE 13', thicknessOptionsMm: [1.2], appliesToProfileCodes: ['549.01', '549.15'], dimensions: { calloutsMm: [28.5, 25] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' } },
  { code: 'TRE 14', thicknessOptionsMm: [1.2], appliesToProfileCodes: ['549.03', '549.17'], dimensions: { calloutsMm: [24, 30] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' } },
  { code: 'TRE 18', thicknessOptionsMm: [1.2, 1.5], appliesToProfileCodes: ['549.20'], dimensions: { calloutsMm: [28.5, 21.5] }, evidence: { documentTitle: source, page: 5, section: 'Reinforcements' } },
]

const prestigeSharedAccessories: ProfileSystemCatalogEntry['accessories'] = [
  { code: 'KM251', labelBg: 'Съединител за делител — каса', appliesToProfileCodes: ['549.17', '549.03'], evidence: { documentTitle: source, page: 5, section: 'Accessories' } },
  { code: 'KM250', labelBg: 'Съединител за делител — крило', appliesToProfileCodes: ['549.17', '549.03'], evidence: { documentTitle: source, page: 5, section: 'Accessories' } },
  { code: 'KM510', labelBg: 'Крайна капачка за 549.04', appliesToProfileCodes: ['549.04'], evidence: { documentTitle: source, page: 5, section: 'Accessories' } },
  { code: 'KM520', labelBg: 'Крайна капачка за праг 70 mm', evidence: { documentTitle: source, page: 5, section: 'Accessories' } },
  { code: 'AP3220/AP3230/AP3240/AP3250', labelBg: 'Glazing spacer', evidence: { documentTitle: source, page: 5, section: 'Accessories' } },
  { code: 'AP3320/AP3324/AP3326/AP3330/AP3332', labelBg: 'Bridge', evidence: { documentTitle: source, page: 5, section: 'Accessories' } },
  { code: 'AP3170/AP3174/AP3172', labelBg: 'Ъгъл', evidence: { documentTitle: source, page: 5, section: 'Accessories' } },
  { code: 'AP3173', labelBg: 'Ъглова връзка за крила за врата 549.05 и 549.11', appliesToProfileCodes: ['549.05', '549.11'], evidence: { documentTitle: source, page: 5, section: 'Accessories' } },
]

const prestigeCoverCaps: ProfileSystemCatalogEntry['aluminiumCoverCaps'] = [
  { code: '3315', labelBg: 'Алуминиева капачка за каса — 331 gr/m', evidence: { documentTitle: source, page: 5, section: 'Aluminium cover caps' } },
  { code: '3312', labelBg: 'Алуминиева капачка за крило — 260 gr/m', evidence: { documentTitle: source, page: 5, section: 'Aluminium cover caps' } },
  { code: '3313', labelBg: 'Алуминиева капачка за крило — 300 gr/m', evidence: { documentTitle: source, page: 5, section: 'Aluminium cover caps' } },
  { code: '3314', labelBg: 'Алуминиева капачка за крило — 317 gr/m', evidence: { documentTitle: source, page: 5, section: 'Aluminium cover caps' } },
  { code: '3318', labelBg: 'Алуминиева капачка за крило за врата — 385 gr/m', evidence: { documentTitle: source, page: 5, section: 'Aluminium cover caps' } },
  { code: '3316', labelBg: 'Алуминиева капачка за делител — 416 gr/m', evidence: { documentTitle: source, page: 5, section: 'Aluminium cover caps' } },
  { code: '3319', labelBg: 'Алуминиева капачка за sash-overhung — 507 gr/m', evidence: { documentTitle: source, page: 5, section: 'Aluminium cover caps' } },
]

export const kmgPrestige70: ProfileSystemCatalogEntry = {
  id: 'kmg-prestige-70',
  manufacturer: 'KMG',
  name: 'PRESTIGE 70',
  family: 'PRESTIGE',
  material: 'PVC',
  nominalDepthMm: 70,
  selectable: true,
  sourceStatus: 'catalog-derived',
  mainProfiles: [
    { code: '549.15', role: 'frame', labelBg: 'Каса', labelCatalog: 'frame', dimensions: { calloutsMm: [70, 68, 46] }, evidence: { documentTitle: source, page: 4, section: 'Main profiles' } },
    { code: '549.20', role: 'frame', labelBg: 'Каса', labelCatalog: 'frame', dimensions: { calloutsMm: [70, 57, 75] }, evidence: { documentTitle: source, page: 4, section: 'Main profiles' } },
    { code: '549.16', role: 'sash', labelBg: 'Крило', labelCatalog: 'sash', dimensions: { calloutsMm: [70, 56.6, 56] }, evidence: { documentTitle: source, page: 4, section: 'Main profiles' } },
    { code: '549.19', role: 'sash', labelBg: 'Крило', labelCatalog: 'sash', dimensions: { calloutsMm: [70, 56.6, 56] }, evidence: { documentTitle: source, page: 4, section: 'Main profiles' } },
    { code: '549.05', role: 'door-sash', labelBg: 'Крило за врата', labelCatalog: 'door sash', dimensions: { calloutsMm: [70, 93, 91] }, evidence: { documentTitle: source, page: 4, section: 'Main profiles' } },
    { code: '549.11', role: 'sash', labelBg: 'Крило', labelCatalog: 'sash', dimensions: { calloutsMm: [70, 113, 71] }, evidence: { documentTitle: source, page: 4, section: 'Main profiles' } },
    { code: '549.17', role: 'mullion', labelBg: 'Делител', labelCatalog: 'mullion', dimensions: { calloutsMm: [70, 88, 44] }, evidence: { documentTitle: source, page: 4, section: 'Main profiles' } },
    { code: '549.04', role: 'overhung', labelBg: 'Overhung профил', labelCatalog: 'overhung', dimensions: { calloutsMm: [73.5, 68, 31.5] }, evidence: { documentTitle: source, page: 4, section: 'Main profiles' } },
  ],
  glassBeads: prestigeSharedGlassBeads,
  additionalProfiles: prestigeSharedAdditionalProfiles,
  gaskets: prestigeSharedGaskets,
  panelsAndSills: prestigeSharedPanels,
  reinforcements: prestigeSharedReinforcements,
  accessories: prestigeSharedAccessories,
  aluminiumCoverCaps: prestigeCoverCaps,
  evidence: [
    { documentTitle: source, page: 4, section: 'PRESTIGE 70mm — profiles, glass beads, additional profiles, EPDM gaskets' },
    { documentTitle: source, page: 5, section: 'PRESTIGE 70mm — panels, sills, reinforcements, accessories, aluminium cover caps' },
  ],
}

export const kmgPrestigePlus70: ProfileSystemCatalogEntry = {
  id: 'kmg-prestige-plus-70',
  manufacturer: 'KMG',
  name: 'PRESTIGE PLUS',
  family: 'PRESTIGE',
  material: 'PVC',
  nominalDepthMm: 70,
  parentSystemId: 'kmg-prestige-70',
  selectable: true,
  sourceStatus: 'catalog-derived',
  mainProfiles: [
    { code: '549.01', role: 'frame', labelBg: 'Каса', labelCatalog: 'frame', dimensions: { calloutsMm: [70, 68, 46] }, evidence: { documentTitle: source, page: 4, section: 'PRESTIGE PLUS' } },
    { code: '549.02', role: 'sash', labelBg: 'Крило', labelCatalog: 'sash', dimensions: { calloutsMm: [70, 56.6, 56] }, evidence: { documentTitle: source, page: 4, section: 'PRESTIGE PLUS' } },
    { code: '549.12', role: 'sash', labelBg: 'Крило', labelCatalog: 'sash', dimensions: { calloutsMm: [70, 56.6, 56] }, evidence: { documentTitle: source, page: 4, section: 'PRESTIGE PLUS' } },
    { code: '549.03', role: 'mullion', labelBg: 'Делител', labelCatalog: 'mullion', dimensions: { calloutsMm: [70, 88, 44] }, evidence: { documentTitle: source, page: 4, section: 'PRESTIGE PLUS' } },
  ],
  glassBeads: prestigeSharedGlassBeads,
  additionalProfiles: prestigeSharedAdditionalProfiles,
  gaskets: prestigeSharedGaskets,
  panelsAndSills: prestigeSharedPanels,
  reinforcements: prestigeSharedReinforcements,
  accessories: prestigeSharedAccessories,
  aluminiumCoverCaps: prestigeCoverCaps,
  evidence: [
    { documentTitle: source, page: 4, section: 'PRESTIGE PLUS — main profiles inside PRESTIGE 70mm catalogue page' },
    { documentTitle: source, page: 5, section: 'PRESTIGE 70mm shared reinforcements and accessories' },
  ],
}

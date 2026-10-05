/**
 * STATIC RUNTIME MIRROR OF DERIVED DATABASE EVIDENCE.
 *
 * This browser-safe dataset is normalized from the repository evidence files
 * named in `sourcePaths`. It is not catalogue truth, validated joint geometry,
 * or machine-ready manufacturing data. Review/regenerate these rows when the
 * source evidence changes; consumers must treat every token as opaque.
 */
export const derivedProfileKnowledgeMetadata = {
  schemaVersion: 1,
  classification: 'DERIVED_DATABASE_EVIDENCE',
  sourcePaths: [
    '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv',
    '.ai/skills/joint-knowledge/data/STANDARD_JOINT_RULE_TOKENS.csv',
    '.ai/skills/joint-knowledge/RELATION_TOKEN_RULES.md',
  ],
  catalogueTruth: false,
  automaticGeometry: false,
  rulesValidated: false,
  machineReady: false,
} as const

export const derivedProfileEvidenceRows = [
  {
    systemId: 'kmg-prelude-60',
    sourceSystem: 'Altest',
    catalogue: 'PVC KMG 60mm',
    profileId: '482.20',
    roleBg: 'Каса',
    profileW: 60,
    profileZ: 68,
    evidenceStatus: 'DATABASE_EVIDENCE',
    sourcePath: '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv',
  },
  {
    systemId: 'kmg-prelude-60',
    sourceSystem: 'Altest',
    catalogue: 'PVC KMG 60mm',
    profileId: '482.21',
    roleBg: 'Делител',
    profileW: 60,
    profileZ: 84,
    evidenceStatus: 'DATABASE_EVIDENCE',
    sourcePath: '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv',
  },
] as const

/**
 * Reviewed presentation contexts associate a selected divider with imported
 * operation rows. The association enables evidence display only; it does not
 * prove a profile-to-profile joint or any physical geometry.
 */
export const derivedDividerJointContexts = [
  {
    systemId: 'kmg-prelude-60',
    dividerProfileId: '482.21',
    dividerAxis: 'horizontal',
    ruleId: 'BeamHorizontalKMG4k',
    sourcePaths: [
      '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv',
      '.ai/skills/joint-knowledge/RELATION_TOKEN_RULES.md',
    ],
  },
  {
    systemId: 'kmg-prelude-60',
    dividerProfileId: '482.21',
    dividerAxis: 'vertical',
    ruleId: 'BeamVerticalKMG4k',
    sourcePaths: [
      '.ai/skills/profile-recognition/data/MASTER_CORE_PROFILES.csv',
      '.ai/skills/joint-knowledge/RELATION_TOKEN_RULES.md',
    ],
  },
] as const

export const derivedJointOperationRows = [
  {
    sourceSystem: 'Altest',
    ruleId: 'BeamHorizontalKMG4k',
    standardOperationName: 'PVC',
    relationToken: 'L_Fr',
    operationCode: '19',
    operation: 'SglobkaDelitel',
    positionExpression: 'POS[]',
    parameter2: '0',
    sourceMarker: 'MM1',
    extraTokens: '',
    evidenceStatus: 'DATABASE_RULE_EVIDENCE',
    geometryStatus: 'UNKNOWN',
    sourcePath: '.ai/skills/joint-knowledge/data/STANDARD_JOINT_RULE_TOKENS.csv',
  },
  {
    sourceSystem: 'Altest',
    ruleId: 'BeamHorizontalKMG4k',
    standardOperationName: 'PVC',
    relationToken: 'R_Fr',
    operationCode: '19',
    operation: 'SglobkaDelitel',
    positionExpression: 'POS[]',
    parameter2: '0',
    sourceMarker: 'MM4',
    extraTokens: '',
    evidenceStatus: 'DATABASE_RULE_EVIDENCE',
    geometryStatus: 'UNKNOWN',
    sourcePath: '.ai/skills/joint-knowledge/data/STANDARD_JOINT_RULE_TOKENS.csv',
  },
  {
    sourceSystem: 'Altest',
    ruleId: 'BeamVerticalKMG4k',
    standardOperationName: 'PVC',
    relationToken: 'U_Fr',
    operationCode: '19',
    operation: 'SglobkaDelitel',
    positionExpression: 'POS[]',
    parameter2: '0',
    sourceMarker: 'MM1',
    extraTokens: '',
    evidenceStatus: 'DATABASE_RULE_EVIDENCE',
    geometryStatus: 'UNKNOWN',
    sourcePath: '.ai/skills/joint-knowledge/data/STANDARD_JOINT_RULE_TOKENS.csv',
  },
  {
    sourceSystem: 'Altest',
    ruleId: 'BeamVerticalKMG4k',
    standardOperationName: 'PVC',
    relationToken: 'D_Fr',
    operationCode: '19',
    operation: 'SglobkaDelitel',
    positionExpression: 'POS[]',
    parameter2: '0',
    sourceMarker: 'MM1',
    extraTokens: '',
    evidenceStatus: 'DATABASE_RULE_EVIDENCE',
    geometryStatus: 'UNKNOWN',
    sourcePath: '.ai/skills/joint-knowledge/data/STANDARD_JOINT_RULE_TOKENS.csv',
  },
] as const

import { useState, type FormEvent } from 'react'
import {
  getConfirmedGlazingOptions,
  getConfirmedHardwareStandards,
  getGlazingOptionById,
  getHardwareStandardById,
  getProfileSystemById,
  getProfileSystemFinishOptionById,
  getProfileSystemFinishOptions,
  getProfileSystemFoilModeById,
  getProfileSystemHardwareCompatibility,
  getSelectableProfileSystems,
} from './data/profileSystems'
import { buildOfferModuleDefaults } from './domain/offerModuleDefaults'
import { resolveConstructionTopology } from './domain/construction'
import {
  createModuleProfileResolution,
  type ModuleProfileResolution,
} from './domain/profileResolution'
import {
  createFirstOfferModule,
  createOfferModule,
  areOfferModuleFieldsDescribed,
  getOfferModuleConfiguredFieldCount,
  getOfferModuleConfiguredOpeningCount,
  getOfferModuleConfiguredHandingCount,
  getOfferModuleHandingRelevantFieldCount,
  getOfferModuleMissingFields,
  getOfferModuleOperableFieldCount,
  isOfferModuleBasicsReady,
  isOfferModuleStructureReady,
  MODULE_DIMENSION_PRESETS_MM,
  MODULE_FIELD_COUNT_PRESETS,
  MODULE_FIELD_TYPE_PRESETS,
  MODULE_FIELD_WIDTH_PRESETS_MM,
  MODULE_OPENING_MODE_PRESETS,
  MODULE_OPENING_HANDING_PRESETS,
  MODULE_PRODUCT_TYPE_PRESETS,
  resizeOfferModuleFields,
  syncOfferModuleFieldsFromTopology,
  type ModuleFieldType,
  type ModuleInputSource,
  type ModuleOpeningMode,
  type ModuleOpeningHanding,
  type ModuleProductType,
  type OfferModuleDraft,
  type OfferModuleFieldDraft,
} from './domain/offerModules'
import ConstructorShell, {
  type ConstructorDraftSnapshot,
  type ConstructorFieldTopologySummary,
} from './components/ConstructorShell'
import './App.css'

function OfferIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 3.5h9l3 3V20.5H6z" />
      <path d="M15 3.5v4h4" />
      <path d="M9 11h6M9 14h6M9 17h4" />
      <path d="M3.5 8.5v12h10" />
    </svg>
  )
}

function ConstructorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5h16v14H4z" />
      <path d="M8 5v14M16 5v14M4 10h16" />
      <path d="M2.5 3v4M1 5h3M21.5 17v4M20 19h3" />
    </svg>
  )
}

const CONTRACTOR_DATA = {
  name: 'НАДЕЖДА',
  activity: 'Al и PVC дограма',
  postalCodeAndCity: '6600 Кърджали',
  district: 'кв. „Студен кладенец“',
  address: 'ул. „Дарец“ № 9',
  email: 'nadejda94@mail.bg',
} as const

type OfferDraft = {
  clientName: string
  clientEik: string
  clientAddress: string
  clientPhone: string
  clientEmail: string
  clientContactPerson: string

  objectName: string
  objectAddress: string

  profileSystemId: string
  colorId: string
  foilModeId: string
  glazingId: string
  hardwareStandardId: string
  hardwareManufacturerId: 'unspecified'
  commonConditions: string
}


type FreeConstructorModule = {
  id: string
  sequence: number
}

const EMPTY_OFFER: OfferDraft = {
  clientName: '',
  clientEik: '',
  clientAddress: '',
  clientPhone: '',
  clientEmail: '',
  clientContactPerson: '',

  objectName: '',
  objectAddress: '',

  profileSystemId: '',
  colorId: '',
  foilModeId: '',
  glazingId: '',
  hardwareStandardId: '',
  hardwareManufacturerId: 'unspecified',
  commonConditions: '',
}

const SELECTABLE_PROFILE_SYSTEMS = getSelectableProfileSystems()
const CONFIRMED_GLAZING_OPTIONS = getConfirmedGlazingOptions()
const CONFIRMED_HARDWARE_STANDARDS = getConfirmedHardwareStandards()

export default function App() {
  const [offerStartOpen, setOfferStartOpen] = useState(false)
  const [offer, setOffer] = useState<OfferDraft>(EMPTY_OFFER)
  const [saved, setSaved] = useState(false)
  const [modules, setModules] = useState<OfferModuleDraft[]>([])
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [moduleSketchDrafts, setModuleSketchDrafts] = useState<
    Record<string, ConstructorDraftSnapshot | null>
  >({})
  const [moduleProfileResolutions, setModuleProfileResolutions] = useState<
    Record<string, ModuleProfileResolution>
  >({})
  const [constructorMode, setConstructorMode] = useState<'offer' | 'free' | null>(null)
  const [offerStartedFromFreeSketch, setOfferStartedFromFreeSketch] = useState(false)
  const [freeModules, setFreeModules] = useState<FreeConstructorModule[]>([])
  const [activeFreeModuleId, setActiveFreeModuleId] = useState<string | null>(null)
  const [freeModuleSketchDrafts, setFreeModuleSketchDrafts] = useState<
    Record<string, ConstructorDraftSnapshot | null>
  >({})
  const [offerSourceSketch, setOfferSourceSketch] = useState<ConstructorDraftSnapshot | null>(null)

  const clientObjectReady =
    offer.clientName.trim().length > 0 &&
    offer.objectName.trim().length > 0

  const selectedProfileSystem = getProfileSystemById(
    offer.profileSystemId,
  )

  const availableFinishOptions = selectedProfileSystem
    ? getProfileSystemFinishOptions(selectedProfileSystem.id)
    : []

  const selectedFinish = selectedProfileSystem
    ? getProfileSystemFinishOptionById(
        selectedProfileSystem.id,
        offer.colorId,
      )
    : undefined

  const selectedFoilMode = selectedProfileSystem && selectedFinish
    ? getProfileSystemFoilModeById(
        selectedProfileSystem.id,
        selectedFinish.id,
        offer.foilModeId,
      )
    : undefined

  const selectedGlazing = getGlazingOptionById(offer.glazingId)

  const selectedHardwareStandard = getHardwareStandardById(
    offer.hardwareStandardId,
  )

  const selectedHardwareCompatibility =
    selectedProfileSystem && selectedHardwareStandard
      ? getProfileSystemHardwareCompatibility(
          selectedProfileSystem.id,
          selectedHardwareStandard.id,
        )
      : undefined

  const canContinueToModules =
    clientObjectReady &&
    Boolean(selectedProfileSystem) &&
    Boolean(selectedFinish) &&
    Boolean(selectedFoilMode) &&
    Boolean(selectedGlazing) &&
    Boolean(selectedHardwareStandard)

  const updateOffer = <K extends keyof OfferDraft>(
    field: K,
    value: OfferDraft[K],
  ) => {
    setOffer((current) => ({
      ...current,
      [field]: value,
    }))
    setSaved(false)

    if (field === 'foilModeId' || field === 'glazingId') {
      setModules([])
      setModuleProfileResolutions({})
    }
  }

  const selectProfileSystem = (profileSystemId: string) => {
    setOffer((current) => ({
      ...current,
      profileSystemId,
      colorId: '',
      foilModeId: '',
      glazingId: '',
      hardwareStandardId: '',
      hardwareManufacturerId: 'unspecified',
    }))
    setSaved(false)
    setModules([])
    setModuleProfileResolutions({})
  }

  const selectFinish = (colorId: string) => {
    setOffer((current) => ({
      ...current,
      colorId,
      foilModeId: '',
    }))
    setSaved(false)
    setModules([])
    setModuleProfileResolutions({})
  }

  const selectHardwareStandard = (hardwareStandardId: string) => {
    setOffer((current) => ({
      ...current,
      hardwareStandardId,
      hardwareManufacturerId: 'unspecified',
    }))
    setSaved(false)
    setModules([])
    setModuleProfileResolutions({})
  }

  const moduleDefaults = canContinueToModules
    ? buildOfferModuleDefaults({
        profileSystemId: offer.profileSystemId,
        colorId: offer.colorId,
        foilModeId: offer.foilModeId,
        glazingId: offer.glazingId,
        hardwareStandardId: offer.hardwareStandardId,
        hardwareManufacturerId: offer.hardwareManufacturerId,
      })
    : undefined

  const firstModule = (
    modules.find((module) => module.id === activeModuleId) ?? modules[0]
  )
  const activeModuleSketchDraft = firstModule
    ? moduleSketchDrafts[firstModule.id] ?? null
    : null
  const activeModuleProfileResolution = firstModule
    ? moduleProfileResolutions[firstModule.id] ??
      createModuleProfileResolution(firstModule.inheritedDefaults.profileSystemId)
    : null
  const activeFreeModule = (
    freeModules.find((module) => module.id === activeFreeModuleId) ?? freeModules[0] ?? null
  )
  const activeFreeModuleDraft = activeFreeModule
    ? freeModuleSketchDrafts[activeFreeModule.id] ?? null
    : null
  const constructorTopologyAuthoritative = Boolean(
    activeModuleSketchDraft?.topology,
  )
  const firstModuleBasicsReady = firstModule
    ? isOfferModuleBasicsReady(firstModule)
    : false
  const firstModuleStructureReady = firstModule
    ? isOfferModuleStructureReady(firstModule)
    : false
  const firstModuleMissingFields = firstModule
    ? getOfferModuleMissingFields(firstModule)
    : []
  const firstModuleConfiguredFieldCount = firstModule
    ? getOfferModuleConfiguredFieldCount(firstModule)
    : 0
  const firstModuleOperableFieldCount = firstModule
    ? getOfferModuleOperableFieldCount(firstModule)
    : 0
  const firstModuleConfiguredOpeningCount = firstModule
    ? getOfferModuleConfiguredOpeningCount(firstModule)
    : 0
  const firstModuleHandingRelevantFieldCount = firstModule
    ? getOfferModuleHandingRelevantFieldCount(firstModule)
    : 0
  const firstModuleConfiguredHandingCount = firstModule
    ? getOfferModuleConfiguredHandingCount(firstModule)
    : 0
  const firstModuleFieldsDescribed = firstModule
    ? areOfferModuleFieldsDescribed(firstModule)
    : false

  const updateFirstModule = (
    patch: Partial<
      Omit<OfferModuleDraft, 'id' | 'sequence' | 'inheritedDefaults'>
    >,
  ) => {
    setModules((current) =>
      current.map((module) =>
        module.id === firstModule?.id ? { ...module, ...patch } : module,
      ),
    )
  }

  const updateFirstModuleField = (
    fieldIndex: number,
    patch: Partial<OfferModuleFieldDraft>,
  ) => {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== firstModule?.id) {
          return module
        }

        return {
          ...module,
          fields: module.fields.map((field, index) =>
            index === fieldIndex ? { ...field, ...patch } : field,
          ),
        }
      }),
    )
  }

  const syncFirstModuleFieldTopology = (
    topologyFields: readonly ConstructorFieldTopologySummary[],
  ) => {
    setModules((current) =>
      current.map((module) =>
        module.id === firstModule?.id
          ? {
              ...module,
              fieldCount: topologyFields.length,
              fieldCountSource: 'constructor',
              fields: syncOfferModuleFieldsFromTopology(
                module.fields,
                topologyFields.map((field) => ({
                  id: field.id,
                  sequence: field.sequence,
                  widthMm: field.widthMm,
                  fieldType: field.fieldType,
                  openingMode: field.openingMode,
                  openingHanding: field.openingHanding,
                })),
              ),
            }
          : module,
      ),
    )
  }

  const setFirstModuleFieldCount = (
    fieldCount: number | null,
    source: ModuleInputSource,
  ) => {
    setModules((current) =>
      current.map((module) =>
        module.id === firstModule?.id
          ? {
              ...module,
              fieldCount,
              fieldCountSource: source,
              fields: resizeOfferModuleFields(module.fields, fieldCount),
            }
          : module,
      ),
    )
  }

  const selectFirstModuleProductType = (value: string) => {
    if (value === '') {
      updateFirstModule({
        productType: null,
        customProductTypeLabel: '',
        productTypeSource: 'unset',
      })
      return
    }

    if (value === 'custom') {
      updateFirstModule({
        productType: null,
        productTypeSource: 'manual',
      })
      return
    }

    updateFirstModule({
      productType: value as ModuleProductType,
      customProductTypeLabel: '',
      productTypeSource: 'preset',
    })
  }

  const selectFirstModuleDimensionSource = (
    dimension: 'width' | 'height',
    source: ModuleInputSource,
  ) => {
    if (dimension === 'width') {
      updateFirstModule({
        widthSource: source,
        widthMm: source === 'unset' ? null : firstModule?.widthMm ?? null,
      })
      return
    }

    updateFirstModule({
      heightSource: source,
      heightMm: source === 'unset' ? null : firstModule?.heightMm ?? null,
    })
  }

  const selectFirstModuleFieldCount = (value: string) => {
    if (value === '') {
      setFirstModuleFieldCount(null, 'unset')
      return
    }

    if (value === 'custom') {
      setFirstModuleFieldCount(null, 'manual')
      return
    }

    setFirstModuleFieldCount(Number(value), 'preset')
  }

  const selectFirstModuleFieldType = (
    fieldIndex: number,
    value: string,
  ) => {
    const resetOpening = {
      openingMode: null,
      customOpeningModeLabel: '',
      openingModeSource: 'unset' as ModuleInputSource,
      openingHanding: null,
      customOpeningHandingLabel: '',
      openingHandingSource: 'unset' as ModuleInputSource,
    }

    if (value === '') {
      updateFirstModuleField(fieldIndex, {
        fieldType: null,
        customFieldTypeLabel: '',
        fieldTypeSource: 'unset',
        ...resetOpening,
      })
      return
    }

    if (value === 'custom') {
      updateFirstModuleField(fieldIndex, {
        fieldType: null,
        fieldTypeSource: 'manual',
        ...resetOpening,
      })
      return
    }

    updateFirstModuleField(fieldIndex, {
      fieldType: value as ModuleFieldType,
      customFieldTypeLabel: '',
      fieldTypeSource: 'preset',
      ...(value === 'operable' ? {} : resetOpening),
    })
  }

  const selectFirstModuleFieldOpeningMode = (
    fieldIndex: number,
    value: string,
  ) => {
    const resetHanding = {
      openingHanding: null,
      customOpeningHandingLabel: '',
      openingHandingSource: 'unset' as ModuleInputSource,
    }

    if (value === '') {
      updateFirstModuleField(fieldIndex, {
        openingMode: null,
        customOpeningModeLabel: '',
        openingModeSource: 'unset',
        ...resetHanding,
      })
      return
    }

    if (value === 'custom') {
      updateFirstModuleField(fieldIndex, {
        openingMode: null,
        openingModeSource: 'manual',
      })
      return
    }

    const openingMode = value as ModuleOpeningMode
    updateFirstModuleField(fieldIndex, {
      openingMode,
      customOpeningModeLabel: '',
      openingModeSource: 'preset',
      ...(openingMode === 'tilt' ? resetHanding : {}),
    })
  }

  const selectFirstModuleFieldOpeningHanding = (
    fieldIndex: number,
    value: string,
  ) => {
    if (value === '') {
      updateFirstModuleField(fieldIndex, {
        openingHanding: null,
        customOpeningHandingLabel: '',
        openingHandingSource: 'unset',
      })
      return
    }

    if (value === 'custom') {
      updateFirstModuleField(fieldIndex, {
        openingHanding: null,
        openingHandingSource: 'manual',
      })
      return
    }

    updateFirstModuleField(fieldIndex, {
      openingHanding: value as ModuleOpeningHanding,
      customOpeningHandingLabel: '',
      openingHandingSource: 'preset',
    })
  }

  const selectFirstModuleFieldWidthSource = (
    fieldIndex: number,
    source: ModuleInputSource,
  ) => {
    const field = firstModule?.fields[fieldIndex]
    updateFirstModuleField(fieldIndex, {
      widthSource: source,
      widthMm: source === 'unset' ? null : field?.widthMm ?? null,
    })
  }

  const startNewOffer = () => {
    setOffer(EMPTY_OFFER)
    setSaved(false)
    setModules([])
    setModuleProfileResolutions({})
    setActiveModuleId(null)
    setModuleSketchDrafts({})
    setConstructorMode(null)
    setOfferStartedFromFreeSketch(false)
    setOfferSourceSketch(null)
    setOfferStartOpen(true)
  }

  const startFreeConstructor = () => {
    setConstructorMode('free')
    setOfferStartOpen(false)
  }

  const startOfferFromFreeSketch = (draft: ConstructorDraftSnapshot | null) => {
    setOfferSourceSketch(draft)
    setOffer(EMPTY_OFFER)
    setSaved(false)
    setModules([])
    setModuleProfileResolutions({})
    setActiveModuleId(null)
    setModuleSketchDrafts({})
    setConstructorMode(null)
    setOfferStartedFromFreeSketch(true)
    setOfferStartOpen(true)
  }

  const submitOffer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canContinueToModules || !moduleDefaults) {
      setSaved(false)
      return
    }

    setSaved(true)

    if (modules.length > 0) {
      if (!activeModuleId) {
        setActiveModuleId(modules[0].id)
      }
      return
    }

    const createdModule = createFirstOfferModule(moduleDefaults)
    const sourceFrame = offerSourceSketch?.frame
    const sourceTopology = offerSourceSketch?.topology
    const topologyFields = sourceTopology
      ? resolveConstructionTopology(sourceTopology).fields
      : []

    const hydratedModule = sourceFrame
      ? {
          ...createdModule,
          widthMm: sourceFrame.widthMm,
          widthSource: sourceTopology ? 'constructor' as const : 'manual' as const,
          heightMm: sourceFrame.heightMm,
          heightSource: sourceTopology ? 'constructor' as const : 'manual' as const,
          fieldCount: sourceTopology ? topologyFields.length : null,
          fieldCountSource: sourceTopology ? 'constructor' as const : 'unset' as const,
          fields: sourceTopology
            ? syncOfferModuleFieldsFromTopology(
                [],
                topologyFields.map((field) => ({
                  id: field.id,
                  sequence: field.sequence,
                  widthMm: field.bounds.widthMm,
                  fieldType: field.fieldType,
                  openingMode: field.openingMode,
                  openingHanding: field.openingHanding,
                })),
              )
            : [],
        }
      : createdModule

    setModules([hydratedModule])
    setActiveModuleId(hydratedModule.id)
    setModuleSketchDrafts({
      [hydratedModule.id]: offerSourceSketch ?? null,
    })
    setModuleProfileResolutions({
      [hydratedModule.id]: createModuleProfileResolution(
        hydratedModule.inheritedDefaults.profileSystemId,
      ),
    })
  }

  const createNextFreeModule = () => {
    const nextSequence = freeModules.reduce(
      (maximum, module) => Math.max(maximum, module.sequence),
      0,
    ) + 1
    const created: FreeConstructorModule = {
      id: `free-module-${nextSequence}`,
      sequence: nextSequence,
    }

    setFreeModules((current) => [...current, created])
    setActiveFreeModuleId(created.id)
    setFreeModuleSketchDrafts((current) => ({
      ...current,
      [created.id]: null,
    }))
  }

  const selectFreeModule = (moduleId: string) => {
    if (!freeModules.some((module) => module.id === moduleId)) return
    setActiveFreeModuleId(moduleId)
  }

  const setActiveFreeModuleDraft = (draft: ConstructorDraftSnapshot | null) => {
    if (!activeFreeModule) return
    setFreeModuleSketchDrafts((current) => ({
      ...current,
      [activeFreeModule.id]: draft,
    }))
  }

  const resetActiveFreeModuleDraft = () => {
    if (!activeFreeModule) return
    setFreeModuleSketchDrafts((current) => ({
      ...current,
      [activeFreeModule.id]: null,
    }))
  }

  const setActiveModuleDraft = (draft: ConstructorDraftSnapshot | null) => {
    if (!firstModule) return
    setModuleSketchDrafts((current) => ({
      ...current,
      [firstModule.id]: draft,
    }))
  }

  const setActiveModuleProfileResolution = (resolution: ModuleProfileResolution) => {
    if (!firstModule) return
    setModuleProfileResolutions((current) => ({
      ...current,
      [firstModule.id]: resolution,
    }))
  }

  const selectModule = (moduleId: string) => {
    if (!modules.some((module) => module.id === moduleId)) return
    setActiveModuleId(moduleId)
  }

  const createNextModule = () => {
    if (!moduleDefaults) return

    const nextSequence = modules.reduce(
      (maximum, module) => Math.max(maximum, module.sequence),
      0,
    ) + 1
    const created = createOfferModule(moduleDefaults, nextSequence)

    setModules((current) => [...current, created])
    setActiveModuleId(created.id)
    setModuleSketchDrafts((current) => ({
      ...current,
      [created.id]: null,
    }))
    setModuleProfileResolutions((current) => ({
      ...current,
      [created.id]: createModuleProfileResolution(
        created.inheritedDefaults.profileSystemId,
      ),
    }))
    setConstructorMode('offer')
  }

  const resetActiveModuleDraft = () => {
    if (!firstModule) return

    setModuleSketchDrafts((current) => ({
      ...current,
      [firstModule.id]: null,
    }))
    setModuleProfileResolutions((current) => ({
      ...current,
      [firstModule.id]: createModuleProfileResolution(
        firstModule.inheritedDefaults.profileSystemId,
      ),
    }))
    setModules((current) => current.map((module) => (
      module.id === firstModule.id
        ? {
            ...module,
            widthMm: null,
            widthSource: 'unset',
            heightMm: null,
            heightSource: 'unset',
            fieldCount: null,
            fieldCountSource: 'unset',
            fields: [],
          }
        : module
    )))
  }


  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <img
            className="nadezhda-header-logo"
            src="/branding/nadezhda-header.png"
            alt="Надежда - алуминиева и PVC дограма"
          />

          <div className="brand-copy">
            <h1>FacadeFlow</h1>
            <p>Оферти и производствена подготовка</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="create-offer-action constructor-direct-action"
            onClick={startFreeConstructor}
          >
            <span className="action-icon">
              <ConstructorIcon />
            </span>

            <span className="action-copy">
              <b>Конструктор</b>
              <small>Свободна скица · без оферта</small>
            </span>
          </button>

          <button
            type="button"
            className="create-offer-action"
            onClick={startNewOffer}
            aria-expanded={offerStartOpen}
          >
            <span className="action-icon">
              <OfferIcon />
            </span>

            <span className="action-copy">
              <b>Създай оферта</b>
              <small>Нов клиент / обект</small>
            </span>
          </button>
        </div>
      </header>

      <main className={constructorMode ? 'constructor-host' : 'home-workspace'}>
        {constructorMode === 'free' ? (
          <ConstructorShell
            key={activeFreeModule?.id ?? 'free-no-module'}
            mode="free"
            moduleNumber={activeFreeModule?.sequence ?? 0}
            moduleItems={freeModules.map((module) => ({
              id: module.id,
              sequence: module.sequence,
            }))}
            activeModuleId={activeFreeModule?.id}
            initialDraft={activeFreeModuleDraft}
            onDraftChange={setActiveFreeModuleDraft}
            onSelectModule={selectFreeModule}
            onCreateModule={createNextFreeModule}
            onResetModule={resetActiveFreeModuleDraft}
            onClose={() => setConstructorMode(null)}
            onCreateOfferFromSketch={startOfferFromFreeSketch}
          />
        ) : constructorMode === 'offer' && firstModule ? (
          <ConstructorShell
            key={firstModule.id}
            mode="offer"
            moduleNumber={firstModule.sequence}
            moduleItems={modules.map((module) => ({
              id: module.id,
              sequence: module.sequence,
            }))}
            activeModuleId={firstModule.id}
            initialDraft={activeModuleSketchDraft}
            onDraftChange={setActiveModuleDraft}
            profileResolution={activeModuleProfileResolution}
            onProfileResolutionChange={setActiveModuleProfileResolution}
            onSelectModule={selectModule}
            onCreateModule={createNextModule}
            onResetModule={resetActiveModuleDraft}
            offerContext={{
              profileSystemId: firstModule.inheritedDefaults.profileSystemId,
              profileSystemLabel: selectedProfileSystem
                ? `${selectedProfileSystem.manufacturer} ${selectedProfileSystem.name}`
                : firstModule.inheritedDefaults.profileSystemId,
              colorLabel: selectedFinish?.labelBg || firstModule.inheritedDefaults.colorId,
              foilModeLabel: selectedFoilMode?.labelBg || firstModule.inheritedDefaults.foilModeId,
              glazingLabel: selectedGlazing?.labelBg || firstModule.inheritedDefaults.glazingId,
              hardwareLabel:
                selectedHardwareStandard?.labelBg ||
                firstModule.inheritedDefaults.hardwareStandardId,
            }}
            moduleSummary={{
              productType: firstModule.productType,
              productTypeLabel:
                MODULE_PRODUCT_TYPE_PRESETS.find(
                  (option) => option.id === firstModule.productType,
                )?.labelBg ||
                firstModule.customProductTypeLabel ||
                'Не е зададен',
              widthMm: firstModule.widthMm,
              heightMm: firstModule.heightMm,
            }}
            onModuleSizeChange={({ widthMm, heightMm }) =>
              updateFirstModule({
                widthMm,
                widthSource: 'constructor',
                heightMm,
                heightSource: 'constructor',
              })
            }
            onFieldTopologyChange={syncFirstModuleFieldTopology}
            onClose={() => setConstructorMode(null)}
          />
        ) : !offerStartOpen ? (
          <section className="empty-home" aria-label="Начален екран">
            <div className="empty-home-watermark" aria-hidden="true">
              <img src="/branding/nadezhda-header.png" alt="" />
            </div>

            <div className="empty-home-card">
              <img
                className="nadezhda-hero-logo"
                src="/branding/nadezhda-header.png"
                alt="Надежда"
              />

              <span className="empty-home-eyebrow">
                НАДЕЖДА · ОФЕРТИ И ПРОИЗВОДСТВЕНА ПОДГОТОВКА
              </span>

              <h2>FacadeFlow</h2>

              <p>
                Започнете по начина, който е удобен за задачата: директно в
                Конструктора за свободна скица или със създаване на оферта,
                клиент, обект и техническа конфигурация.
              </p>

              <div className="empty-home-actions">
                <button type="button" onClick={startFreeConstructor}>
                  <b>Отвори Конструктор</b>
                  <small>Чертане без оферта</small>
                </button>
                <button type="button" onClick={startNewOffer}>
                  <b>Създай оферта</b>
                  <small>Клиент → система → модули</small>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="offer-start" aria-label="Нова оферта">
            <div className="offer-start-heading">
              <div>
                {offerStartedFromFreeSketch && (
                  <div className="offer-source-note">
                    Източник: Свободен конструктор · габаритът на касата се запазва, а техническата система се задава сега
                  </div>
                )}
                <span>НОВА ОФЕРТА</span>
                <h2>Изпълнител / Клиент / Обект / Система / Цвят / Стъклопакет / Обков</h2>
                <p>
                  След клиента и обекта избираме профилната система
                  от централния каталог, после избираме цвят, фолиране, стъклопакет и общ обков.
                </p>
              </div>

              <button
                type="button"
                className="secondary-action"
                onClick={() => {
                  setOfferStartOpen(false)
                  if (offerStartedFromFreeSketch) {
                    setConstructorMode('free')
                  }
                }}
              >
                {offerStartedFromFreeSketch ? 'Назад към скицата' : 'Назад към началото'}
              </button>
            </div>

            <form className="offer-form" onSubmit={submitOffer}>

              {/* CONCEPT 02 continuity: Клиент и обект */}

              <section
                className="form-section contractor-section"
                aria-labelledby="contractor-title"
              >
                <div className="section-heading">
                  <span className="section-number">01</span>

                  <div>
                    <h3 id="contractor-title">Изпълнител</h3>
                    <p>
                      Постоянните фирмени данни на Надежда се използват
                      автоматично във всяка оферта.
                    </p>
                  </div>
                </div>

                <article className="contractor-card">
                  <div className="contractor-brand">
                    <img
                      src="/branding/nadezhda-header.png"
                      alt="Надежда"
                    />

                    <div>
                      <span className="contractor-label">
                        ИЗПЪЛНИТЕЛ
                      </span>

                      <h4>{CONTRACTOR_DATA.name}</h4>

                      <p>{CONTRACTOR_DATA.activity}</p>
                    </div>
                  </div>

                  <div className="contractor-details">
                    <div>
                      <span>ГРАД</span>
                      <b>{CONTRACTOR_DATA.postalCodeAndCity}</b>
                    </div>

                    <div>
                      <span>КВАРТАЛ</span>
                      <b>{CONTRACTOR_DATA.district}</b>
                    </div>

                    <div>
                      <span>АДРЕС</span>
                      <b>{CONTRACTOR_DATA.address}</b>
                    </div>

                    <div>
                      <span>E-MAIL</span>
                      <b>{CONTRACTOR_DATA.email}</b>
                    </div>
                  </div>

                  <div className="contractor-lock">
                    Фиксирани фирмени данни
                  </div>
                </article>
              </section>

              <section
                className="form-section"
                aria-labelledby="client-title"
              >
                <div className="section-heading">
                  <span className="section-number">02</span>

                  <div>
                    <h3 id="client-title">
                      Клиент / Възложител
                    </h3>

                    <p>
                      Фирмата или лицето, за което се подготвя офертата.
                    </p>
                  </div>
                </div>

                <div className="form-grid client-grid">
                  <label className="field">
                    <span>Фирма / име</span>

                    <input
                      required
                      value={offer.clientName}
                      onChange={(event) =>
                        updateOffer('clientName', event.target.value)
                      }
                      placeholder="Наименование на фирма или име"
                    />
                  </label>

                  <label className="field">
                    <span>ЕИК / Булстат</span>

                    <input
                      value={offer.clientEik}
                      onChange={(event) =>
                        updateOffer('clientEik', event.target.value)
                      }
                      placeholder="ЕИК / Булстат"
                    />
                  </label>

                  <label className="field field-wide">
                    <span>Адрес</span>

                    <input
                      value={offer.clientAddress}
                      onChange={(event) =>
                        updateOffer('clientAddress', event.target.value)
                      }
                      placeholder="Адрес на клиента / фирмата"
                    />
                  </label>

                  <label className="field">
                    <span>Телефон</span>

                    <input
                      type="tel"
                      value={offer.clientPhone}
                      onChange={(event) =>
                        updateOffer('clientPhone', event.target.value)
                      }
                      placeholder="Телефон"
                    />
                  </label>

                  <label className="field">
                    <span>Email</span>

                    <input
                      type="email"
                      value={offer.clientEmail}
                      onChange={(event) =>
                        updateOffer('clientEmail', event.target.value)
                      }
                      placeholder="Email"
                    />
                  </label>

                  <label className="field">
                    <span>Лице за контакт</span>

                    <input
                      value={offer.clientContactPerson}
                      onChange={(event) =>
                        updateOffer(
                          'clientContactPerson',
                          event.target.value,
                        )
                      }
                      placeholder="Име на лице за контакт"
                    />
                  </label>
                </div>
              </section>

              <section
                className="form-section object-section"
                aria-labelledby="object-title"
              >
                <div className="section-heading">
                  <span className="section-number">03</span>

                  <div>
                    <h3 id="object-title">Обект</h3>

                    <p>
                      Конкретният обект, за който ще бъде изпълнена офертата.
                    </p>
                  </div>
                </div>

                <div className="form-grid two-columns">
                  <label className="field">
                    <span>Наименование на обекта</span>

                    <input
                      required
                      value={offer.objectName}
                      onChange={(event) =>
                        updateOffer('objectName', event.target.value)
                      }
                      placeholder="Напр. Жилищна сграда, къща, офис..."
                    />
                  </label>

                  <label className="field">
                    <span>Адрес на обекта</span>

                    <input
                      value={offer.objectAddress}
                      onChange={(event) =>
                        updateOffer('objectAddress', event.target.value)
                      }
                      placeholder="Град, улица, номер"
                    />
                  </label>
                </div>
              </section>

              <section
                className="form-section profile-system-section"
                aria-labelledby="profile-system-title"
              >
                <div className="section-heading">
                  <span className="section-number">04</span>

                  <div>
                    <h3 id="profile-system-title">
                      Профилна система
                    </h3>

                    <p>
                      Изборът идва от централния каталог и се записва
                      в офертата само като идентификатор на системата.
                    </p>
                  </div>
                </div>

                {!clientObjectReady && (
                  <div className="profile-system-lock" role="status">
                    <b>Първо попълнете Клиент и Обект.</b>
                    <span>След това ще можете да изберете профилна система.</span>
                  </div>
                )}

                <div
                  className={`profile-system-options${
                    clientObjectReady ? '' : ' is-locked'
                  }`}
                >
                  {SELECTABLE_PROFILE_SYSTEMS.map((system) => {
                    const selected = offer.profileSystemId === system.id

                    return (
                      <label
                        className={`profile-system-option${
                          selected ? ' is-selected' : ''
                        }`}
                        key={system.id}
                      >
                        <input
                          type="radio"
                          name="profileSystemId"
                          value={system.id}
                          checked={selected}
                          disabled={!clientObjectReady}
                          required
                          onChange={(event) =>
                            selectProfileSystem(event.target.value)
                          }
                        />

                        <span className="profile-system-card-copy">
                          <small>{system.manufacturer}</small>
                          <b>{system.name}</b>
                          <em>
                            {system.material} · {system.nominalDepthMm} mm
                          </em>
                        </span>

                        <span className="profile-system-meta">
                          {system.mainProfiles.length} основни профила
                        </span>
                      </label>
                    )
                  })}
                </div>

                {selectedProfileSystem && (
                  <div className="selected-system-note" role="status">
                    <span>ИЗБРАНА СИСТЕМА</span>
                    <b>
                      {selectedProfileSystem.manufacturer}{' '}
                      {selectedProfileSystem.name}
                    </b>
                    <small>
                      ID: {selectedProfileSystem.id}
                    </small>
                  </div>
                )}
              </section>

              <section
                className="form-section finish-section"
                aria-labelledby="finish-title"
              >
                <div className="section-heading">
                  <span className="section-number">05</span>

                  <div>
                    <h3 id="finish-title">Цвят и фолиране</h3>
                    <p>
                      След избора на профилна система задаваме цвета
                      и начина на фолиране за офертата.
                    </p>
                  </div>
                </div>

                {!selectedProfileSystem && (
                  <div className="finish-lock" role="status">
                    <b>Първо изберете профилна система.</b>
                    <span>След това ще се покажат потвърдените цветови опции.</span>
                  </div>
                )}

                {selectedProfileSystem && availableFinishOptions.length === 0 && (
                  <div className="finish-lock" role="status">
                    <b>Няма въведени цветови опции за тази система.</b>
                    <span>Не се прави автоматично предположение за цвят.</span>
                  </div>
                )}

                {selectedProfileSystem && availableFinishOptions.length > 0 && (
                  <div className="finish-workflow">
                    <fieldset className="finish-fieldset">
                      <legend>Цвят</legend>

                      <div className="finish-color-options">
                        {availableFinishOptions.map((finish) => {
                          const selected = offer.colorId === finish.id

                          return (
                            <label
                              className={`finish-option${
                                selected ? ' is-selected' : ''
                              }`}
                              key={finish.id}
                            >
                              <input
                                type="radio"
                                name="colorId"
                                value={finish.id}
                                checked={selected}
                                required
                                onChange={(event) =>
                                  selectFinish(event.target.value)
                                }
                              />

                              <span>
                                <b>{finish.labelBg}</b>
                                <small>Потвърдена оперативна опция</small>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>

                    <fieldset
                      className="finish-fieldset foil-fieldset"
                      disabled={!selectedFinish}
                    >
                      <legend>Фолиране</legend>

                      {!selectedFinish && (
                        <p className="finish-step-note">
                          Първо изберете цвят.
                        </p>
                      )}

                      {selectedFinish && (
                        <div className="foil-mode-options">
                          {selectedFinish.foilModes.map((mode) => {
                            const selected = offer.foilModeId === mode.id

                            return (
                              <label
                                className={`foil-mode-option${
                                  selected ? ' is-selected' : ''
                                }`}
                                key={mode.id}
                              >
                                <input
                                  type="radio"
                                  name="foilModeId"
                                  value={mode.id}
                                  checked={selected}
                                  required
                                  onChange={(event) =>
                                    updateOffer(
                                      'foilModeId',
                                      event.target.value,
                                    )
                                  }
                                />

                                <span>
                                  <b>{mode.labelBg}</b>
                                  <small>
                                    {mode.coverage === 'both-sides'
                                      ? 'Фолио отвън и отвътре'
                                      : 'Фолио само от външната страна'}
                                  </small>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </fieldset>

                    {selectedFoilMode?.interiorColorStatus === 'unspecified' && (
                      <div className="finish-boundary-note" role="status">
                        При „Външно фолиран“ вътрешният цвят остава неуточнен.
                        FacadeFlow не го предполага автоматично.
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section
                className="form-section glazing-section"
                aria-labelledby="glazing-title"
              >
                <div className="section-heading">
                  <span className="section-number">06</span>

                  <div>
                    <h3 id="glazing-title">Стъклопакет</h3>
                    <p>
                      След цвета и фолирането избираме потвърдената
                      конфигурация на стъклопакета за офертата.
                    </p>
                  </div>
                </div>

                {!selectedFoilMode && (
                  <div className="glazing-lock" role="status">
                    <b>Първо изберете цвят и фолиране.</b>
                    <span>След това ще се покажат потвърдените стъклопакети.</span>
                  </div>
                )}

                {selectedFoilMode && (
                  <div className="glazing-workflow">
                    <fieldset className="glazing-fieldset">
                      <legend>Изберете стъклопакет</legend>

                      <div className="glazing-options">
                        {CONFIRMED_GLAZING_OPTIONS.map((glazing) => {
                          const selected = offer.glazingId === glazing.id

                          return (
                            <label
                              className={`glazing-option${
                                selected ? ' is-selected' : ''
                              }`}
                              key={glazing.id}
                            >
                              <input
                                type="radio"
                                name="glazingId"
                                value={glazing.id}
                                checked={selected}
                                required
                                onChange={(event) =>
                                  updateOffer('glazingId', event.target.value)
                                }
                              />

                              <span>
                                <b>{glazing.labelBg}</b>
                                <small>{glazing.descriptionBg}</small>
                              </span>

                              <em>{glazing.totalThicknessMm} mm</em>
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>

                    <div className="glazing-legend" aria-label="Легенда за стъклата">
                      <b>Легенда</b>
                      <span><strong>б</strong> = бяло / обикновено стъкло</span>
                      <span><strong>к</strong> = стъкло за зимна топлозащита</span>
                      <span><strong>4S</strong> = Four Seasons</span>
                    </div>

                    <div className="glazing-boundary-note" role="status">
                      Дебелината е записана точно както е потвърдена.
                      FacadeFlow не предполага дебелини на отделните стъкла
                      или дистанционери и все още не извежда автоматично
                      съвместимост от каталожните стъклодържатели.
                    </div>
                  </div>
                )}
              </section>

              <section
                className="form-section hardware-section"
                aria-labelledby="hardware-title"
              >
                <div className="section-heading">
                  <span className="section-number">07</span>

                  <div>
                    <h3 id="hardware-title">Обков</h3>
                    <p>
                      Общият стандарт на обкова се задава на ниво оферта
                      и после се наследява от модулите.
                    </p>
                  </div>
                </div>

                {!selectedGlazing && (
                  <div className="hardware-lock" role="status">
                    <b>Първо изберете стъклопакет.</b>
                    <span>След това ще можете да зададете общия стандарт на обкова.</span>
                  </div>
                )}

                {selectedGlazing && (
                  <div className="hardware-workflow">
                    <fieldset className="hardware-fieldset">
                      <legend>Стандарт</legend>

                      <div className="hardware-options">
                        {CONFIRMED_HARDWARE_STANDARDS.map((hardware) => {
                          const selected =
                            offer.hardwareStandardId === hardware.id

                          return (
                            <label
                              className={`hardware-option${
                                selected ? ' is-selected' : ''
                              }`}
                              key={hardware.id}
                            >
                              <input
                                type="radio"
                                name="hardwareStandardId"
                                value={hardware.id}
                                checked={selected}
                                required
                                onChange={(event) =>
                                  selectHardwareStandard(event.target.value)
                                }
                              />

                              <span>
                                <b>{hardware.labelBg}</b>
                                <small>{hardware.descriptionBg}</small>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>

                    <div className="hardware-manufacturer-card">
                      <span>ПРОИЗВОДИТЕЛ / МАРКА</span>
                      <b>Не е уточнен</b>
                      <small>
                        На този етап конкретна европейска марка не се фиксира.
                      </small>
                    </div>

                    {selectedHardwareStandard &&
                      selectedHardwareCompatibility && (
                        <div
                          className="hardware-compatibility-note is-confirmed"
                          role="status"
                        >
                          <b>Потвърдено за PRELUDE 60</b>
                          <span>{selectedHardwareCompatibility.noteBg}</span>
                        </div>
                      )}

                    {selectedHardwareStandard &&
                      selectedProfileSystem &&
                      !selectedHardwareCompatibility && (
                        <div
                          className="hardware-compatibility-note"
                          role="status"
                        >
                          <b>Съвместимостта още не е валидирана за тази система.</b>
                          <span>
                            FacadeFlow не пренася автоматично правилото на PRELUDE 60
                            към друга профилна система.
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </section>

              <section
                className="form-section"
                aria-labelledby="offer-parameters-title"
              >
                <div className="section-heading">
                  <span className="section-number">08</span>

                  <div>
                    <h3 id="offer-parameters-title">
                      Други общи параметри
                    </h3>

                    <p>
                      Тук остават общите условия към офертата. Типът на изделието
                      ще се задава поотделно във всеки модул.
                    </p>
                  </div>
                </div>

                <div className="module-scope-note">
                  <b>Тип изделие = параметър на модула</b>
                  <span>
                    Прозорец, врата и конкретната функция няма да се заключват
                    като една обща стойност за цялата оферта.
                  </span>
                </div>

                <label className="field full-width-field">
                  <span>Общи условия</span>

                  <textarea
                    value={offer.commonConditions}
                    onChange={(event) =>
                      updateOffer(
                        'commonConditions',
                        event.target.value,
                      )
                    }
                    placeholder="Допълнителни условия, уточнения или общи изисквания към офертата"
                    rows={4}
                  />
                </label>
              </section>

              <aside
                className="offer-party-summary"
                aria-label="Страни и обект"
              >
                <div>
                  <span>ИЗПЪЛНИТЕЛ</span>
                  <b>Надежда</b>
                </div>

                <div>
                  <span>КЛИЕНТ</span>
                  <b>
                    {offer.clientName || 'Не е попълнен'}
                  </b>
                </div>

                <div>
                  <span>ОБЕКТ</span>
                  <b>
                    {offer.objectName || 'Не е попълнен'}
                  </b>
                </div>
              </aside>

              <aside
                className="offer-summary"
                aria-label="Резюме на общите параметри"
              >
                <div>
                  <span>СИСТЕМА</span>
                  <b>
                    {selectedProfileSystem
                      ? `${selectedProfileSystem.manufacturer} ${selectedProfileSystem.name}`
                      : 'Не е избрана'}
                  </b>
                </div>

                <div>
                  <span>ЦВЯТ</span>
                  <b>{selectedFinish?.labelBg || 'Не е избран'}</b>
                </div>

                <div>
                  <span>ФОЛИРАНЕ</span>
                  <b>{selectedFoilMode?.labelBg || 'Не е избрано'}</b>
                </div>

                <div>
                  <span>СТЪКЛОПАКЕТ</span>
                  <b>{selectedGlazing?.labelBg || 'Не е избран'}</b>
                </div>

                <div>
                  <span>ОБКОВ</span>
                  <b>{selectedHardwareStandard?.labelBg || 'Не е избран'}</b>
                </div>

                <div>
                  <span>МАРКА ОБКОВ</span>
                  <b>Не е уточнена</b>
                </div>
              </aside>

              <div className="module-defaults-note" role="status">
                <div>
                  <span>ОБЩИ НАСТРОЙКИ ЗА МОДУЛИТЕ</span>
                  <b>Система · Цвят · Фолиране · Стъклопакет · Обков</b>
                </div>

                <p>
                  Тези стойности важат за всички модули в офертата.
                  Конкретният тип, размери, полета и отваряния се задават
                  в Конструктора, без промяна на общата офертна конфигурация.
                </p>
              </div>

              <div className="offer-form-footer">
                <div>
                  <strong>
                    Следваща стъпка: Модули
                  </strong>

                  <p>
                    След записване започваме Модул 1,
                    Модул 2, Модул 3… в общия технически контекст на офертата.
                  </p>
                </div>

                <button
                  type="submit"
                  className="save-offer-action"
                  disabled={!canContinueToModules}
                >
                  Запази и продължи към модули
                </button>
              </div>

              {saved && moduleDefaults && (
                <div className="saved-notice" role="status">
                  <b>
                    Офертата и общите технически настройки за модулите са подготвени.
                  </b>

                  <span>
                    Модул 1 е създаден в заключения технически контекст на офертата.
                  </span>
                </div>
              )}
            </form>

            {saved && firstModule && (
              <section
                className="module-workspace"
                aria-labelledby={`module-${firstModule.sequence}-title`}
              >
                <div className="module-workspace-heading">
                  <div>
                    <span>МОДУЛ {String(firstModule.sequence).padStart(2, '0')}</span>
                    <h2 id={`module-${firstModule.sequence}-title`}>Модул {firstModule.sequence}</h2>
                    <p>
                      Модулът работи в общата техническа конфигурация на офертата.
                      Отворете Конструктора за CAD-подобното работно поле; текущите
                      опционални полета остават като чернова и контекст.
                    </p>
                  </div>

                  <div className="module-heading-actions">
                    <div className="module-inheritance-badge">
                      Общата офертна конфигурация важи за модула
                    </div>

                    <button
                      type="button"
                      className="open-constructor-action"
                      onClick={() => setConstructorMode('offer')}
                    >
                      Отвори Конструктор
                    </button>
                  </div>
                </div>

                <div className="module-workspace-switcher" aria-label="Модули в офертата">
                  <div className="module-workspace-tabs">
                    {modules.map((module) => (
                      <button
                        type="button"
                        key={module.id}
                        className={module.id === firstModule.id ? 'is-active' : ''}
                        onClick={() => selectModule(module.id)}
                      >
                        Модул {module.sequence}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="module-workspace-new"
                    onClick={createNextModule}
                  >
                    + Нов модул
                  </button>
                </div>

                <div className="module-inherited-defaults">
                  <div>
                    <span>СИСТЕМА</span>
                    <b>
                      {selectedProfileSystem
                        ? `${selectedProfileSystem.manufacturer} ${selectedProfileSystem.name}`
                        : firstModule.inheritedDefaults.profileSystemId}
                    </b>
                  </div>

                  <div>
                    <span>ЦВЯТ / ФОЛИРАНЕ</span>
                    <b>
                      {selectedFinish?.labelBg || firstModule.inheritedDefaults.colorId}
                      {' · '}
                      {selectedFoilMode?.labelBg || firstModule.inheritedDefaults.foilModeId}
                    </b>
                  </div>

                  <div>
                    <span>СТЪКЛОПАКЕТ</span>
                    <b>{selectedGlazing?.labelBg || firstModule.inheritedDefaults.glazingId}</b>
                  </div>

                  <div>
                    <span>ОБКОВ</span>
                    <b>
                      {selectedHardwareStandard?.labelBg ||
                        firstModule.inheritedDefaults.hardwareStandardId}
                    </b>
                  </div>
                </div>

                <div className="module-optional-note" role="status">
                  <b>Модул {firstModule.sequence} може да остане чернова.</b>
                  <span>
                    Всички модулни стойности на този етап са опционални. Използвайте
                    падащите менюта за стандартните избори или ръчно въвеждане за
                    нестандартни стойности.
                  </span>
                </div>

                <div className="module-hybrid-grid">
                  <section className="module-hybrid-card">
                    <div className="module-hybrid-heading">
                      <span>ТИП ИЗДЕЛИЕ</span>
                      <small>опционално</small>
                    </div>

                    <label className="field">
                      <span>Избор</span>
                      <select
                        value={
                          firstModule.productTypeSource === 'manual'
                            ? 'custom'
                            : firstModule.productType ?? ''
                        }
                        onChange={(event) =>
                          selectFirstModuleProductType(event.target.value)
                        }
                      >
                        <option value="">Не е избран</option>
                        {MODULE_PRODUCT_TYPE_PRESETS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.labelBg}
                          </option>
                        ))}
                        <option value="custom">Друго / ръчно</option>
                      </select>
                    </label>

                    {firstModule.productTypeSource === 'manual' && (
                      <label className="field">
                        <span>Ръчно описание</span>
                        <input
                          value={firstModule.customProductTypeLabel}
                          onChange={(event) =>
                            updateFirstModule({
                              customProductTypeLabel: event.target.value,
                            })
                          }
                          placeholder="Напр. нестандартно изделие"
                        />
                      </label>
                    )}
                  </section>

                  <section className="module-hybrid-card">
                    <div className="module-hybrid-heading">
                      <span>ШИРИНА</span>
                      <small>опционално</small>
                    </div>

                    <label className="field">
                      <span>Начин на въвеждане</span>
                      <select
                        value={firstModule.widthSource}
                        disabled={constructorTopologyAuthoritative}
                        onChange={(event) =>
                          selectFirstModuleDimensionSource(
                            'width',
                            event.target.value as ModuleInputSource,
                          )
                        }
                      >
                        <option value="unset">Не е зададена</option>
                        <option value="manual">Ръчно / нестандартно</option>
                        <option value="constructor" disabled>От Конструктора</option>
                        <option
                          value="preset"
                          disabled={MODULE_DIMENSION_PRESETS_MM.length === 0}
                        >
                          Стандартен размер
                        </option>
                      </select>
                    </label>

                    {firstModule.widthSource === 'manual' && (
                      <label className="field">
                        <span>Ширина</span>
                        <div className="dimension-input-wrap">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            value={firstModule.widthMm ?? ''}
                            onChange={(event) =>
                              updateFirstModule({
                                widthMm:
                                  event.target.value === ''
                                    ? null
                                    : Number(event.target.value),
                              })
                            }
                            placeholder="Въведете размер"
                          />
                          <em>mm</em>
                        </div>
                      </label>
                    )}

                    {firstModule.widthSource === 'constructor' && (
                      <div className="module-constructor-derived-value">
                        <span>Ширина от Конструктора</span>
                        <b>{firstModule.widthMm ?? '—'} mm</b>
                      </div>
                    )}

                    {firstModule.widthSource === 'preset' &&
                      MODULE_DIMENSION_PRESETS_MM.length > 0 && (
                        <label className="field">
                          <span>Стандартна ширина</span>
                          <select
                            value={firstModule.widthMm ?? ''}
                            onChange={(event) =>
                              updateFirstModule({
                                widthMm:
                                  event.target.value === ''
                                    ? null
                                    : Number(event.target.value),
                              })
                            }
                          >
                            <option value="">Изберете</option>
                            {MODULE_DIMENSION_PRESETS_MM.map((value) => (
                              <option key={value} value={value}>
                                {value} mm
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                    {MODULE_DIMENSION_PRESETS_MM.length === 0 && (
                      <p className="module-preset-boundary">
                        Няма заредени потвърдени стандартни размери. FacadeFlow не
                        измисля preset стойности; ръчното въвеждане остава достъпно.
                      </p>
                    )}
                  </section>

                  <section className="module-hybrid-card">
                    <div className="module-hybrid-heading">
                      <span>ВИСОЧИНА</span>
                      <small>опционално</small>
                    </div>

                    <label className="field">
                      <span>Начин на въвеждане</span>
                      <select
                        value={firstModule.heightSource}
                        disabled={constructorTopologyAuthoritative}
                        onChange={(event) =>
                          selectFirstModuleDimensionSource(
                            'height',
                            event.target.value as ModuleInputSource,
                          )
                        }
                      >
                        <option value="unset">Не е зададена</option>
                        <option value="manual">Ръчно / нестандартно</option>
                        <option value="constructor" disabled>От Конструктора</option>
                        <option
                          value="preset"
                          disabled={MODULE_DIMENSION_PRESETS_MM.length === 0}
                        >
                          Стандартен размер
                        </option>
                      </select>
                    </label>

                    {firstModule.heightSource === 'manual' && (
                      <label className="field">
                        <span>Височина</span>
                        <div className="dimension-input-wrap">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            value={firstModule.heightMm ?? ''}
                            onChange={(event) =>
                              updateFirstModule({
                                heightMm:
                                  event.target.value === ''
                                    ? null
                                    : Number(event.target.value),
                              })
                            }
                            placeholder="Въведете размер"
                          />
                          <em>mm</em>
                        </div>
                      </label>
                    )}

                    {firstModule.heightSource === 'constructor' && (
                      <div className="module-constructor-derived-value">
                        <span>Височина от Конструктора</span>
                        <b>{firstModule.heightMm ?? '—'} mm</b>
                      </div>
                    )}

                    {firstModule.heightSource === 'preset' &&
                      MODULE_DIMENSION_PRESETS_MM.length > 0 && (
                        <label className="field">
                          <span>Стандартна височина</span>
                          <select
                            value={firstModule.heightMm ?? ''}
                            onChange={(event) =>
                              updateFirstModule({
                                heightMm:
                                  event.target.value === ''
                                    ? null
                                    : Number(event.target.value),
                              })
                            }
                          >
                            <option value="">Изберете</option>
                            {MODULE_DIMENSION_PRESETS_MM.map((value) => (
                              <option key={value} value={value}>
                                {value} mm
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                    {MODULE_DIMENSION_PRESETS_MM.length === 0 && (
                      <p className="module-preset-boundary">
                        Стандартните височини ще се появят тук, когато бъдат
                        потвърдени. До тогава стойността може да се въведе ръчно.
                      </p>
                    )}
                  </section>

                  <section className="module-hybrid-card">
                    <div className="module-hybrid-heading">
                      <span>БРОЙ ПОЛЕТА</span>
                      <small>опционално</small>
                    </div>

                    <label className="field">
                      <span>Конструкция</span>
                      <select
                        disabled={constructorTopologyAuthoritative}
                        value={
                          firstModule.fieldCountSource === 'manual'
                            ? 'custom'
                            : firstModule.fieldCount?.toString() ?? ''
                        }
                        onChange={(event) =>
                          selectFirstModuleFieldCount(event.target.value)
                        }
                      >
                        <option value="">Не е зададено</option>
                        {firstModule.fieldCountSource === 'constructor' &&
                          firstModule.fieldCount !== null &&
                          !MODULE_FIELD_COUNT_PRESETS.includes(firstModule.fieldCount as 1 | 2 | 3 | 4) && (
                            <option value={firstModule.fieldCount}>
                              {firstModule.fieldCount} полета · Конструктор
                            </option>
                          )}
                        {MODULE_FIELD_COUNT_PRESETS.map((count) => (
                          <option key={count} value={count}>
                            {count} {count === 1 ? 'поле' : 'полета'}
                          </option>
                        ))}
                        <option value="custom">Друг брой / ръчно</option>
                      </select>
                    </label>

                    {firstModule.fieldCountSource === 'manual' && (
                      <label className="field">
                        <span>Ръчен брой полета</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={firstModule.fieldCount ?? ''}
                          onChange={(event) =>
                            setFirstModuleFieldCount(
                              event.target.value === ''
                                ? null
                                : Number(event.target.value),
                              'manual',
                            )
                          }
                          placeholder="Напр. 5"
                        />
                      </label>
                    )}
                    {constructorTopologyAuthoritative && (
                      <p className="module-constructor-boundary">
                        Броят полета се управлява от Конструктора. За промяна отвори Модул {firstModule.sequence} в Конструктора и раздели/обедини ПОЛЕ.
                      </p>
                    )}
                  </section>
                </div>

                {firstModule.fields.length > 0 && (
                  <section
                    className="module-fields-section"
                    aria-labelledby="module-fields-title"
                  >
                    <div className="module-fields-heading">
                      <div>
                        <span>CONCEPT 06C + 06D + 06E</span>
                        <h3 id="module-fields-title">Полетата на Модул {firstModule.sequence}</h3>
                        <p>
                          Всяко поле е отделна опционална чернова. Изберете
                          потвърден тип от менюто или използвайте ръчно описание
                          за нестандартен случай. За отваряемо поле може отделно
                          да зададете начин на отваряне и, когато е приложимо, работна страна ляво / дясно; всичко може да остане празно.
                        </p>
                        {constructorTopologyAuthoritative && (
                          <p className="module-constructor-boundary">
                            Типът на ПОЛЕТО и отваряемостта идват от Конструктора. Редактирай ги върху самото ПОЛЕ, за да има една канонична истина.
                          </p>
                        )}
                      </div>

                      <div className="module-fields-progress">
                        <span>
                          {firstModuleConfiguredFieldCount} / {firstModule.fields.length} типове
                        </span>
                        <span>
                          {firstModuleConfiguredOpeningCount} / {firstModuleOperableFieldCount} отваряния
                        </span>
                        <span>
                          {firstModuleConfiguredHandingCount} / {firstModuleHandingRelevantFieldCount} страни
                        </span>
                      </div>
                    </div>

                    <div className="module-fields-grid">
                      {firstModule.fields.map((field, fieldIndex) => (
                        <article className="module-field-card" key={field.id}>
                          <div className="module-field-card-heading">
                            <div>
                              <span>ПОЛЕ {String(field.sequence).padStart(2, '0')}</span>
                              <b>Поле {field.sequence}</b>
                            </div>
                            <small>опционално</small>
                          </div>

                          <label className="field">
                            <span>Тип поле</span>
                            <select
                              value={
                                field.fieldTypeSource === 'manual'
                                  ? 'custom'
                                  : field.fieldType ?? ''
                              }
                              disabled={constructorTopologyAuthoritative}
                              onChange={(event) =>
                                selectFirstModuleFieldType(
                                  fieldIndex,
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Не е зададено</option>
                              {MODULE_FIELD_TYPE_PRESETS.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.labelBg}
                                </option>
                              ))}
                              <option value="custom">Друго / ръчно</option>
                            </select>
                          </label>

                          {field.fieldTypeSource === 'manual' && (
                            <label className="field">
                              <span>Ръчно описание на полето</span>
                              <input
                                value={field.customFieldTypeLabel}
                                onChange={(event) =>
                                  updateFirstModuleField(fieldIndex, {
                                    customFieldTypeLabel: event.target.value,
                                  })
                                }
                                placeholder="Напр. нестандартно поле"
                              />
                            </label>
                          )}

                          {(field.fieldTypeSource === 'preset' ||
                            field.fieldTypeSource === 'constructor') &&
                            field.fieldType === 'operable' && (
                              <div className="module-opening-block">
                                <label className="field">
                                  <span>Начин на отваряне</span>
                                  <select
                                    value={
                                      field.openingModeSource === 'manual'
                                        ? 'custom'
                                        : field.openingMode ?? ''
                                    }
                                    disabled={constructorTopologyAuthoritative}
                                    onChange={(event) =>
                                      selectFirstModuleFieldOpeningMode(
                                        fieldIndex,
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value="">Не е зададено</option>
                                    {MODULE_OPENING_MODE_PRESETS.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.labelBg}
                                      </option>
                                    ))}
                                    <option value="custom">Друго / ръчно</option>
                                  </select>
                                </label>

                                {field.openingModeSource === 'manual' && (
                                  <label className="field">
                                    <span>Ръчно описание на отварянето</span>
                                    <input
                                      value={field.customOpeningModeLabel}
                                      onChange={(event) =>
                                        updateFirstModuleField(fieldIndex, {
                                          customOpeningModeLabel: event.target.value,
                                        })
                                      }
                                      placeholder="Напр. специално / нестандартно отваряне"
                                    />
                                  </label>
                                )}

                                {(field.openingModeSource === 'manual' ||
                                  ((field.openingModeSource === 'preset' ||
                                    field.openingModeSource === 'constructor') &&
                                    (field.openingMode === 'side-hinged' ||
                                      field.openingMode === 'tilt-turn'))) && (
                                  <div className="module-handing-block">
                                    <label className="field">
                                      <span>Работна страна на отваряне</span>
                                      <select
                                        value={
                                          field.openingHandingSource === 'manual'
                                            ? 'custom'
                                            : field.openingHanding ?? ''
                                        }
                                        disabled={constructorTopologyAuthoritative}
                                        onChange={(event) =>
                                          selectFirstModuleFieldOpeningHanding(
                                            fieldIndex,
                                            event.target.value,
                                          )
                                        }
                                      >
                                        <option value="">Не е зададена</option>
                                        {MODULE_OPENING_HANDING_PRESETS.map((option) => (
                                          <option key={option.id} value={option.id}>
                                            {option.labelBg}
                                          </option>
                                        ))}
                                        <option value="custom">Друго / ръчно</option>
                                      </select>
                                    </label>

                                    {field.openingHandingSource === 'manual' && (
                                      <label className="field">
                                        <span>Ръчно описание на страната</span>
                                        <input
                                          value={field.customOpeningHandingLabel}
                                          onChange={(event) =>
                                            updateFirstModuleField(fieldIndex, {
                                              customOpeningHandingLabel: event.target.value,
                                            })
                                          }
                                          placeholder="Напр. по схема / специално условие"
                                        />
                                      </label>
                                    )}

                                    <p className="module-handing-note">
                                      Ляво / дясно е работна човешка стойност. Референтната
                                      гледна страна още не е стандартизирана и не се използва
                                      за автоматична геометрия или машинни данни.
                                    </p>
                                  </div>
                                )}

                                <p className="module-opening-note">
                                  Начинът на отваряне и работната страна са опционални.
                                  При падащо отваряне ляво / дясно не се изисква.
                                </p>
                              </div>
                            )}

                          <label className="field">
                            <span>Ширина на поле</span>
                            <select
                              value={field.widthSource}
                              disabled={constructorTopologyAuthoritative}
                              onChange={(event) =>
                                selectFirstModuleFieldWidthSource(
                                  fieldIndex,
                                  event.target.value as ModuleInputSource,
                                )
                              }
                            >
                              <option value="unset">Не е зададена</option>
                              <option value="manual">Ръчно / нестандартно</option>
                              <option value="constructor" disabled>От Конструктора</option>
                              <option
                                value="preset"
                                disabled={MODULE_FIELD_WIDTH_PRESETS_MM.length === 0}
                              >
                                Стандартна ширина
                              </option>
                            </select>
                          </label>

                          {field.widthSource === 'manual' && (
                            <label className="field">
                              <span>Ширина</span>
                              <div className="dimension-input-wrap">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  inputMode="numeric"
                                  value={field.widthMm ?? ''}
                                  onChange={(event) =>
                                    updateFirstModuleField(fieldIndex, {
                                      widthMm:
                                        event.target.value === ''
                                          ? null
                                          : Number(event.target.value),
                                    })
                                  }
                                  placeholder="Въведете размер"
                                />
                                <em>mm</em>
                              </div>
                            </label>
                          )}

                          {field.widthSource === 'constructor' && (
                            <div className="module-constructor-derived-value compact">
                              <span>Ширина от топологията</span>
                              <b>{field.widthMm ?? '—'} mm</b>
                            </div>
                          )}

                          {field.widthSource === 'preset' &&
                            MODULE_FIELD_WIDTH_PRESETS_MM.length > 0 && (
                              <label className="field">
                                <span>Стандартна ширина</span>
                                <select
                                  value={field.widthMm ?? ''}
                                  onChange={(event) =>
                                    updateFirstModuleField(fieldIndex, {
                                      widthMm:
                                        event.target.value === ''
                                          ? null
                                          : Number(event.target.value),
                                    })
                                  }
                                >
                                  <option value="">Изберете</option>
                                  {MODULE_FIELD_WIDTH_PRESETS_MM.map((value) => (
                                    <option key={value} value={value}>
                                      {value} mm
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}

                          {MODULE_FIELD_WIDTH_PRESETS_MM.length === 0 && (
                            <p className="module-preset-boundary">
                              Няма потвърдени стандартни ширини за отделните
                              полета. Ръчното въвеждане е достъпно, а полето може
                              да остане празно.
                            </p>
                          )}
                        </article>
                      ))}
                    </div>

                    <div className="module-fields-boundary">
                      Полетата са концептуално описание. Начините на отваряне също
                      остават концептуални. FacadeFlow не създава автоматично делители,
                      крила или геометрия,
                      не изравнява ширини и не превръща работното ляво / дясно в геометрична
                      или производствена посока. Референтната гледна страна, страна на панти,
                      профили, механизми и производствени размери още не се извеждат автоматично.
                    </div>
                  </section>
                )}

                <div
                  className={`module-basics-status${
                    firstModuleStructureReady ? ' is-ready' : ''
                  }`}
                  role="status"
                >
                  <b>
                    {firstModuleStructureReady
                      ? 'Основните данни и броят полета са въведени.'
                      : `Модул ${firstModule.sequence} е запазен като опционална чернова.`}
                  </b>
                  <span>
                    {firstModuleStructureReady
                      ? 'Следващият етап може да описва всяко поле поотделно.'
                      : `Неуточнени: ${firstModuleMissingFields.join(', ') || 'няма'}. Това не блокира черновата.`}
                  </span>
                  <span>
                    Основни данни (тип + ширина + височина):{' '}
                    {firstModuleBasicsReady ? 'въведени' : 'непълни'}.
                  </span>
                  {firstModule.fields.length > 0 && (
                    <span>
                      Полета: {firstModuleConfiguredFieldCount} / {firstModule.fields.length}{' '}
                      описани; {firstModuleFieldsDescribed ? 'всички са описани' : 'описанието може да остане непълно'}.
                    </span>
                  )}
                  {firstModuleOperableFieldCount > 0 && (
                    <span>
                      Отваряеми полета: {firstModuleConfiguredOpeningCount} / {firstModuleOperableFieldCount}{' '}
                      имат зададен начин на отваряне; останалите могат да останат чернова.
                    </span>
                  )}
                </div>

                <div className="module-geometry-boundary">
                  Concept 06B не генерира геометрия и не предполага стандартни
                  размери. Concept 06C описва полетата като опционални чернови,
                  а Concept 06D добавя опционален начин на отваряне за отваряемите
                  полета. Не се определят автоматично ляво / дясно, панти,
                  делители, крила или механизми. Машинни данни не се подготвят.
                </div>
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

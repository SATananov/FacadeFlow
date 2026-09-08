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
import {
  createFirstOfferModule,
  isOfferModuleBasicsReady,
  type ModuleProductType,
  type OfferModuleDraft,
} from './domain/offerModules'
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
  }

  const selectFinish = (colorId: string) => {
    setOffer((current) => ({
      ...current,
      colorId,
      foilModeId: '',
    }))
    setSaved(false)
    setModules([])
  }

  const selectHardwareStandard = (hardwareStandardId: string) => {
    setOffer((current) => ({
      ...current,
      hardwareStandardId,
      hardwareManufacturerId: 'unspecified',
    }))
    setSaved(false)
    setModules([])
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

  const firstModule = modules[0]
  const firstModuleBasicsReady = firstModule
    ? isOfferModuleBasicsReady(firstModule)
    : false

  const updateFirstModule = (
    patch: Partial<Pick<OfferModuleDraft, 'productType' | 'widthMm' | 'heightMm'>>,
  ) => {
    setModules((current) =>
      current.map((module, index) =>
        index === 0 ? { ...module, ...patch } : module,
      ),
    )
  }

  const startNewOffer = () => {
    setOffer(EMPTY_OFFER)
    setSaved(false)
    setModules([])
    setOfferStartOpen(true)
  }

  const submitOffer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canContinueToModules || !moduleDefaults) {
      setSaved(false)
      return
    }

    setSaved(true)
    setModules((current) =>
      current.length > 0
        ? current
        : [createFirstOfferModule(moduleDefaults)],
    )
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
      </header>

      <main className="home-workspace">
        {!offerStartOpen ? (
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
                Работният процес започва със създаване на оферта.
                Първо задаваме клиента и обекта, след това избираме
                профилната система, цвета и фолирането преди модулите.
              </p>
            </div>
          </section>
        ) : (
          <section className="offer-start" aria-label="Нова оферта">
            <div className="offer-start-heading">
              <div>
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
                onClick={() => setOfferStartOpen(false)}
              >
                Назад към началото
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
                  Всеки нов модул ще започва с тези стойности, наследени
                  от офертата. Конкретният тип, размери, отваряния и
                  модулен обков ще се задават в следващия етап.
                </p>
              </div>

              <div className="offer-form-footer">
                <div>
                  <strong>
                    Следваща стъпка: Модули
                  </strong>

                  <p>
                    След записване започваме Модул 1,
                    Модул 2, Модул 3… с наследени общи настройки.
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
                    Модул 1 е създаден с наследени общи настройки от офертата.
                  </span>
                </div>
              )}
            </form>

            {saved && firstModule && (
              <section
                className="module-workspace"
                aria-labelledby="module-1-title"
              >
                <div className="module-workspace-heading">
                  <div>
                    <span>МОДУЛ 01</span>
                    <h2 id="module-1-title">Модул 1</h2>
                    <p>
                      Първият модул наследява общите настройки на офертата.
                      Тук задаваме само типа на изделието и основните габарити.
                    </p>
                  </div>

                  <div className="module-inheritance-badge">
                    Наследява общите настройки
                  </div>
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

                <div className="module-basics-grid">
                  <fieldset className="module-type-fieldset">
                    <legend>Тип изделие</legend>

                    <div className="module-type-options">
                      {(
                        [
                          ['window', 'Прозорец'],
                          ['door', 'Врата'],
                        ] as const
                      ).map(([value, label]) => (
                        <label
                          className={`module-type-option${
                            firstModule.productType === value
                              ? ' is-selected'
                              : ''
                          }`}
                          key={value}
                        >
                          <input
                            type="radio"
                            name="module1ProductType"
                            value={value}
                            checked={firstModule.productType === value}
                            onChange={(event) =>
                              updateFirstModule({
                                productType: event.target.value as ModuleProductType,
                              })
                            }
                          />

                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="module-dimensions">
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
                          placeholder="напр. 1200"
                        />
                        <em>mm</em>
                      </div>
                    </label>

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
                          placeholder="напр. 1400"
                        />
                        <em>mm</em>
                      </div>
                    </label>
                  </div>
                </div>

                <div
                  className={`module-basics-status${
                    firstModuleBasicsReady ? ' is-ready' : ''
                  }`}
                  role="status"
                >
                  <b>
                    {firstModuleBasicsReady
                      ? 'Основните данни за Модул 1 са въведени.'
                      : 'Модул 1 очаква тип, ширина и височина.'}
                  </b>
                  <span>
                    {firstModuleBasicsReady
                      ? 'Следващият етап ще зададе конструкция, крила и отваряния.'
                      : 'Тези стойности са модулни и не променят общите настройки на офертата.'}
                  </span>
                </div>

                <div className="module-geometry-boundary">
                  Concept 06A не създава автоматична геометрия, не избира
                  отваряния и не подготвя машинни данни.
                </div>
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

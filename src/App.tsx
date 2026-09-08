import { useState, type FormEvent } from 'react'
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

  system: string
  productType: string
  color: string
  glazing: string
  hardware: string
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

  system: 'Prelude 60',
  productType: 'Прозорец',
  color: 'Бяло',
  glazing: 'б + б / 24',
  hardware: 'Siegenia',
  commonConditions: '',
}

export default function App() {
  const [offerStartOpen, setOfferStartOpen] = useState(false)
  const [offer, setOffer] = useState<OfferDraft>(EMPTY_OFFER)
  const [saved, setSaved] = useState(false)

  const updateOffer = <K extends keyof OfferDraft>(
    field: K,
    value: OfferDraft[K],
  ) => {
    setOffer((current) => ({
      ...current,
      [field]: value,
    }))
    setSaved(false)
  }

  const startNewOffer = () => {
    setOffer(EMPTY_OFFER)
    setSaved(false)
    setOfferStartOpen(true)
  }

  const submitOffer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaved(true)
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
                Първо задаваме клиента, обекта и общите параметри,
                след което започваме отделните модули.
              </p>
            </div>
          </section>
        ) : (
          <section className="offer-start" aria-label="Нова оферта">
            <div className="offer-start-heading">
              <div>
                <span>НОВА ОФЕРТА</span>
                <h2>Изпълнител / Клиент / Обект</h2>
                <p>
                  Изпълнителят е Надежда. За всяка оферта попълваме
                  възложителя, обекта и общите технически параметри.
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
                className="form-section"
                aria-labelledby="offer-parameters-title"
              >
                <div className="section-heading">
                  <span className="section-number">04</span>

                  <div>
                    <h3 id="offer-parameters-title">
                      Основни параметри на офертата
                    </h3>

                    <p>
                      Тези настройки важат за офертата и после могат
                      да се наследяват от модулите.
                    </p>
                  </div>
                </div>

                <div className="form-grid parameter-grid">
                  <label className="field">
                    <span>Система</span>

                    <select
                      value={offer.system}
                      onChange={(event) =>
                        updateOffer('system', event.target.value)
                      }
                    >
                      <option>Prelude 60</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Тип</span>

                    <select
                      value={offer.productType}
                      onChange={(event) =>
                        updateOffer('productType', event.target.value)
                      }
                    >
                      <option>Прозорец</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Цвят</span>

                    <select
                      value={offer.color}
                      onChange={(event) =>
                        updateOffer('color', event.target.value)
                      }
                    >
                      <option>Бяло</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Стъклопакет</span>

                    <select
                      value={offer.glazing}
                      onChange={(event) =>
                        updateOffer('glazing', event.target.value)
                      }
                    >
                      <option>б + б / 24</option>
                      <option>б + б / 32</option>
                      <option>б + 4S / 24</option>
                      <option>к + б / 32</option>
                      <option>к + б + 4S / 44</option>
                    </select>
                  </label>

                  <p className="glazing-note">
                    б = обикновено · к = зимна топлозащита ·
                    4S = Four Seasons
                  </p>
                </div>

                <fieldset className="hardware-fieldset">
                  <legend>Обков</legend>

                  <div className="hardware-options">
                    {['Siegenia', 'Maco'].map((hardware) => (
                      <label
                        className="hardware-option"
                        key={hardware}
                      >
                        <input
                          type="radio"
                          name="hardware"
                          value={hardware}
                          checked={offer.hardware === hardware}
                          onChange={(event) =>
                            updateOffer(
                              'hardware',
                              event.target.value,
                            )
                          }
                        />

                        <span>
                          <b>{hardware}</b>
                          <small>
                            Основен обков за офертата
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

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
                  <b>{offer.system}</b>
                </div>

                <div>
                  <span>ТИП</span>
                  <b>{offer.productType}</b>
                </div>

                <div>
                  <span>ЦВЯТ</span>
                  <b>{offer.color}</b>
                </div>

                <div>
                  <span>СТЪКЛОПАКЕТ</span>
                  <b>{offer.glazing}</b>
                </div>

                <div>
                  <span>ОБКОВ</span>
                  <b>{offer.hardware}</b>
                </div>
              </aside>

              <div className="offer-form-footer">
                <div>
                  <strong>
                    Следваща стъпка: Модули
                  </strong>

                  <p>
                    След записване започваме Модул 1,
                    Модул 2, Модул 3…
                  </p>
                </div>

                <button
                  type="submit"
                  className="save-offer-action"
                >
                  Запази и продължи към модули
                </button>
              </div>

              {saved && (
                <div className="saved-notice" role="status">
                  <b>
                    Основните параметри на офертата са подготвени.
                  </b>

                  <span>
                    Следващият етап ще бъде създаването на модулите.
                  </span>
                </div>
              )}
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

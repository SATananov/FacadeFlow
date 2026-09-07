import { useState } from 'react'
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

export default function App() {
  const [offerStartOpen, setOfferStartOpen] = useState(false)

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
          onClick={() => setOfferStartOpen(true)}
          aria-expanded={offerStartOpen}
        >
          <span className="action-icon"><OfferIcon /></span>
          <span className="action-copy">
            <b>Създай оферта</b>
            <small>Нов клиент / обект</small>
          </span>
        </button>
      </header>

      <main className="home-workspace">
        {!offerStartOpen ? (
          <section className="empty-home" aria-label="Начален екран">
            <div className="empty-home-mark" aria-hidden="true">FF</div>
            <h2>FacadeFlow</h2>
            <p>Работният процес започва със създаване на оферта.</p>
          </section>
        ) : (
          <section className="offer-start" aria-label="Нова оферта">
            <div className="offer-start-heading">
              <div>
                <span>НОВА ОФЕРТА</span>
                <h2>Клиент / Обект</h2>
                <p>Това е началната точка на новия FacadeFlow workflow.</p>
              </div>
              <button type="button" className="secondary-action" onClick={() => setOfferStartOpen(false)}>
                Затвори
              </button>
            </div>

            <div className="next-step-placeholder">
              <strong>Следваща стъпка</strong>
              <p>Тук ще изградим точните данни за клиент и обект след уточняване на реалния процес.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

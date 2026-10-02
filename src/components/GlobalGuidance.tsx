import './GlobalGuidance.css'

export type GuidanceContext = 'home' | 'offer-client' | 'offer-system' | 'offer-materials' | 'offer-modules'
  | 'constructor' | 'composite' | 'catalogs' | 'models' | 'orders' | 'completed-orders' | 'assembly'

type Guidance = { title: string; purpose: string; next: string; steps: readonly string[] }

const projectSteps = [
  'Полетата със * са задължителни. Следвайте стъпките „Клиент и обект“, „Система“, „Материали“ и „Модули“.',
  '„Запази и продължи към модули“ приема данните за офертата и отваря модулите. За състоянието на записа следете лентата на проекта горе.',
  'За редакция се върнете чрез „Продължи офертата“ и изберете „1 · Клиент и обект“. „Запази“ в лентата на проекта записва текущата работа; не я одобрява за производство.',
]

const evidenceSteps = [
  'Каталожните данни са сведения от посочения източник за конкретен профил или сглобка. Проверявайте източника и показания статус.',
  'Прегледаните сведения и ръчно въведените стойности са различни източници. Ръчната стойност или чернова не става автоматично каталожно доказателство.',
  'Неизвестните връзки остават неизвестни. Наличието на два профила в каталог не доказва съвместимостта им.',
  'Потребителското потвърждение не прави сглобката готова за машинно производство и не валидира производствени правила.',
]

export const GUIDANCE: Record<GuidanceContext, Guidance> = {
  home: {
    title: 'Начало', purpose: 'Изберете откъде да започнете или продължете запазен проект.',
    next: 'Изберете „Нова оферта“ за клиент и обект или „Нова свободна скица“ за работа без оферта.',
    steps: ['Съществуващите проекти се отварят чрез „Отвори проект“ или „Продължи“ в списъка със запазени проекти.', ...projectSteps],
  },
  'offer-client': { title: 'Оферта · Клиент и обект', purpose: 'Тук описвате за кого и за кой обект е офертата.', next: 'Попълнете задължителните данни и изберете „Продължи към Система“.', steps: projectSteps },
  'offer-system': { title: 'Оферта · Система', purpose: 'Тук избирате профилната система за офертата.', next: 'Изберете система от наличните възможности и продължете към „Материали“.', steps: projectSteps },
  'offer-materials': { title: 'Оферта · Материали', purpose: 'Тук задавате общите материали за модулите.', next: 'Попълнете изискваните цвят / фолиране, стъклопакет и обков, после „Запази и продължи към модули“.', steps: projectSteps },
  'offer-modules': { title: 'Оферта · Модули', purpose: 'Тук описвате отделните изделия в офертата.', next: 'Изберете модул и продължете към Конструктора за неговата скица и FIELD конфигурация.', steps: projectSteps },
  constructor: {
    title: 'Конструктор · Скица', purpose: 'Размери и конфигурация на полетата на избрания модул.',
    next: 'Ако няма модул, създайте го. Изберете типа на модула и задайте външните размери.',
    steps: [
      'Настройте FIELD разпределението. Делителите служат за позиция и разпределение.',
      'Изберете FIELD върху скицата. В панела вдясно задайте типа и приложимите начин и посока на отваряне изрично.',
      'Размерите и символите за отваряне са информационни означения на зададените данни.',
    ],
  },
  composite: { title: 'Структура на модула', purpose: 'Тук преглеждате и редактирате съставната структура на избрания модул.', next: 'Прегледайте частите и наличните настройки, преди да запазите структурата.', steps: ['Структурната скица в Конструктора е само преглед. Промените се правят в „Структура на модула“.', 'Записът на структура не е производствено одобрение.'] },
  catalogs: { title: 'Каталози', purpose: 'Това е входът към каталожните данни; отделният каталожен екран още не е свързан.', next: 'За наличните профили използвайте настройките в Конструктора, а за източниците на сглобки — „Сглобки“.', steps: evidenceSteps },
  models: { title: 'Модели', purpose: 'Тук преглеждате библиотеката с модели.', next: 'Прегледайте наличните модели и показаните за тях данни. За работа по изделие отворете офертата или Конструктора.', steps: ['Моделът не е доказателство за валидирани производствени правила или готовност за машинно производство.'] },
  orders: { title: 'Поръчки', purpose: 'Тук е показан работният ред за проверка на поръчки.', next: 'Ако списъкът е празен, продължете подготовката на офертата и модулите.', steps: ['Показаните правила за проверка не означават, че производственото предаване е отключено.'] },
  'completed-orders': { title: 'Завършени поръчки', purpose: 'Тук е предвидена историята на приключените поръчки.', next: 'Ако историята е празна, върнете се към текущата оферта или проект.', steps: ['Този екран не потвърждава готовност за производство на текущия проект.'] },
  assembly: { title: 'Сглобки · Преглед', purpose: 'Тук преглеждате сглобките и сведенията за избрания модул.', next: 'Изберете сглобка и проверете профилите, източника и липсващите сведения. Ако няма модул, първо го изберете в Конструктора.', steps: evidenceSteps },
}

export function getGuidanceContext(screen: {
  section: 'home' | 'orders' | 'completed-orders' | 'catalogs' | 'models'
  constructorMode: 'free' | 'offer' | null
  offerStartOpen: boolean
  offerStep: 1 | 2 | 3 | 4
  composite: boolean
}): GuidanceContext {
  if (screen.composite) return 'composite'
  if (screen.constructorMode) return 'constructor'
  if (screen.section !== 'home') return screen.section
  if (screen.offerStartOpen) return (['offer-client', 'offer-system', 'offer-materials', 'offer-modules'] as const)[screen.offerStep - 1]
  return 'home'
}

// Native non-modal popover: no workspace setters, persistence or navigation.
// Escape and outside clicks dismiss it; its close control returns to the trigger.
export function GlobalGuidance({ id, context, navigation = false }: { id: string; context: GuidanceContext; navigation?: boolean }) {
  const guide = GUIDANCE[context]
  return <>
    <button type="button" className={navigation ? 'product-nav-item global-guidance-trigger' : 'global-guidance-trigger'}
      popoverTarget={id} aria-controls={id} aria-label={`Помощ: ${guide.title}`}>
      <span aria-hidden="true">?</span> Помощ
    </button>
    <aside id={id} popover="auto" className="global-guidance-panel" aria-labelledby={`${id}-title`}
      onToggle={(event) => { if (event.newState === 'open') event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus() }}
      onKeyDown={(event) => { if (event.key === 'Escape') event.stopPropagation() }}>
      <div className="global-guidance-heading">
        <h2 id={`${id}-title`}>{guide.title}</h2>
        <button type="button" popoverTarget={id} popoverTargetAction="hide" autoFocus>Затвори помощта</button>
      </div>
      <p className="global-guidance-next"><strong>Следваща стъпка</strong>{guide.next}</p>
      <p className="global-guidance-purpose">{guide.purpose}</p>
      <ul>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ul>
      {context === 'constructor' && <details>
        <summary>Профили и сглобки · как да четете данните</summary>
        <ul>
          <li>За профилите използвайте настройките на избрания обект. За сглобките отворете „Сглобки“ от лентата на проекта.</li>
          <li>Делителите сами по себе си не потвърждават профил или сглобка. Не приемайте непотвърдена геометрия на профили или панти за доказана.</li>
          {evidenceSteps.map((step) => <li key={step}>{step}</li>)}
        </ul>
      </details>}
      <p className="global-guidance-footer">Затворете помощта с бутона, Esc или щракване извън нея и продължете работата.</p>
    </aside>
  </>
}

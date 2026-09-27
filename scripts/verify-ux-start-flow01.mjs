import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(app, /Нова оферта/, 'home must expose a clear New offer route')
assert.match(app, /Нова свободна скица/, 'home must expose a clear free sketch route')
assert.match(app, /Свободен проект · без клиент/, 'free project label must explain that it has no client')
assert.match(app, /offer-flow-steps/, 'offer must show a visible step guide')
assert.match(app, /4 · Модули/, 'offer step guide must include Modules')
assert.match(app, /id="offer-modules-step"/, 'module workspace must have a scroll target')
assert.match(app, /scrollIntoView\(\{[\s\S]*behavior: 'smooth'/, 'saving the offer must guide the user to modules')
assert.match(app, /СТЪПКА 4 · ИЗДЕЛИЯ \/ МОДУЛИ/, 'module workspace must announce the new stage')
assert.match(app, /className="module-next-action"/, 'constructor entry must expose a clear next-step panel')
assert.match(app, /Продължете към Конструктора/, 'constructor path must be explicit')
assert.match(app, /Липсващите размери и полета могат да се зададат в Конструктора/, 'draft path must stay explicit')
assert.match(app, /form-section form-section-secondary/, 'secondary offer parameters must have lower visual hierarchy')

assert.match(css, /\.offer-flow-steps\s*\{/, 'step guide styling must exist')
assert.match(css, /\.form-section-secondary\s*\{/, 'secondary section styling must exist')
assert.match(css, /\.module-step-banner\s*\{/, 'module stage banner styling must exist')
assert.match(css, /\.module-next-action\s*\{/, 'module next-action styling must exist')
assert.match(css, /#offer-modules-step\s*\{[\s\S]*scroll-margin-top:/, 'module scroll target must account for sticky chrome')

assert.doesNotMatch(app, /AUTOMATIC GEOMETRY:\s*YES/i)
assert.doesNotMatch(app, /RULES VALIDATED:\s*YES/i)
assert.doesNotMatch(app, /MACHINE READY:\s*YES/i)

console.log('UX START FLOW 01: PASS')
console.log('Guided home routes: PASS')
console.log('Offer step guide: PASS')
console.log('Offer → Modules guided transition: PASS')
console.log('Constructor next-step guidance: PASS')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')

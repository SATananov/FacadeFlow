import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

assert.match(app, /const getReturnOfferStep = \(\): 1 \| 2 \| 3 \| 4 =>/, 'return flow must resolve the safest offer step')
assert.match(app, /if \(saved \|\| modules\.length > 0\) return 4/, 'saved offer/modules must return to modules')
assert.match(app, /const continueCurrentOffer = \(\) =>/, 'current offer needs one return action')
assert.match(app, /setConstructorMode\(null\)[\s\S]*setOfferFlowStep\(getReturnOfferStep\(\)\)[\s\S]*setOfferStartOpen\(true\)/, 'return action must reopen offer instead of creating a new project')
assert.match(app, /onClick=\{openOfferFromHome\}[\s\S]*\{hasOfferProjectWork \|\| singleRecoverableProject \? 'Продължи офертата' : 'Създай оферта'\}/, 'header offer action must continue current or recoverable offer')
assert.match(app, /hasOfferProjectWork && !offerStartOpen[\s\S]*project-return-offer-action[\s\S]*onClick=\{continueCurrentOffer\}[\s\S]*Продължи офертата/, 'project toolbar must expose a direct return to the current offer')
assert.match(app, /<b>\{hasOfferProjectWork \|\| singleRecoverableProject \? 'Продължи офертата' : 'Нова оферта'\}<\/b>/, 'home must continue current or uniquely recoverable offer')
assert.doesNotMatch(app, /hasOfferProjectWork && !hasOfferConstructorWork \? 'Продължи офертата'/, 'return must not disappear after modules are created')
assert.match(css, /\.project-return-offer-action\s*\{/, 'return action must have deliberate toolbar styling')

console.log('UX OFFER RETURN 01: PASS')
console.log('Existing offer return from header: PASS')
console.log('Existing offer return from project toolbar: PASS')
console.log('Offer with modules remains reopenable: PASS')
console.log('Recoverable offer accepted by return entry points: PASS')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')

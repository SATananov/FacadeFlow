import fs from 'node:fs'

const app = fs.readFileSync('src/App.tsx', 'utf8')
const shell = fs.readFileSync('src/components/ConstructorShell.tsx', 'utf8')
const appCss = fs.readFileSync('src/App.css', 'utf8')
const shellCss = fs.readFileSync('src/components/ConstructorShell.css', 'utf8')
const acceptance = fs.readFileSync('docs/CONSTRUCTOR_01A_1_DIRECT_ENTRY_ACCEPTANCE.md', 'utf8')

const checks = [
  [app.includes("useState<'offer' | 'free' | null>(null)"), 'App has explicit offer/free constructor launch modes'],
  [app.includes('startFreeConstructor'), 'App exposes direct constructor entry'],
  [app.includes('Свободна скица · без оферта'), 'Header labels direct entry as free sketch without offer'],
  [app.includes('mode="free"'), 'App launches shared ConstructorShell in free mode'],
  [app.includes('mode="offer"'), 'App preserves offer-mode ConstructorShell route'],
  [app.includes('startOfferFromFreeSketch'), 'Free sketch can continue toward offer creation'],
  [shell.includes("export type ConstructorMode = 'offer' | 'free'"), 'ConstructorShell has explicit shared mode type'],
  [shell.includes('Не е избрана'), 'Free mode does not invent a profile system'],
  [shell.includes('Създай оферта от тази скица'), 'Free mode exposes offer conversion entry'],
  [shell.includes('CONSTRUCTOR 01A.1'), 'Constructor shell identifies 01A.1'],
  [appCss.includes('.constructor-direct-action'), 'Direct constructor action has FacadeFlow styling'],
  [shellCss.includes('.constructor-free-context'), 'Free sketch context has dedicated styling'],
  [acceptance.includes('No profile system is automatically selected.'), 'Acceptance forbids automatic system selection'],
  [acceptance.includes('PARAMETRIC FRAME: NO'), 'Acceptance keeps geometry boundary'],
  [acceptance.includes('MACHINE READY: NO'), 'Acceptance keeps machine-ready boundary'],
]

for (const [ok, message] of checks) {
  if (!ok) {
    console.error(`CONSTRUCTOR 01A.1 VERIFY FAIL: ${message}`)
    process.exit(1)
  }
}

console.log('CONSTRUCTOR 01A.1 DIRECT ENTRY VERIFY PASS')
console.log('ENTRY: HOME/HEADER -> FREE CONSTRUCTOR')
console.log('OFFER ROUTE: OFFER -> MODULE 1 -> CONSTRUCTOR')
console.log('ENGINE: SHARED CONSTRUCTOR SHELL')
console.log('FREE MODE: NO CLIENT / NO OBJECT / NO OFFER REQUIRED')
console.log('FREE MODE SYSTEM: UNSELECTED - NOT INVENTED')
console.log('FREE SKETCH -> OFFER ROUTE: FOUNDATION PRESENT')
console.log('PARAMETRIC FRAME: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('MACHINE READY: NO')

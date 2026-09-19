import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const panel = read('src/components/AssemblyReviewPanel.tsx')
const css = read('src/components/AssemblyReviewPanel.css')
const library = read('src/domain/customJointLibrary.ts')

assert(panel.includes('function JointSourcePanel'), 'Joint source panel missing')
assert(panel.includes('function CustomJointWorkspace'), 'Custom joint workspace missing')
assert(panel.includes('Създай собствена сглобка'), 'Create custom joint action missing')
assert(panel.includes('Фабрично проверена'), 'Factory-verified source state missing')
assert(panel.includes('Фирмено потвърдена'), 'Company-confirmed source state missing')
assert(panel.includes('Собствена чернова'), 'Custom draft source state missing')
assert(panel.includes('Неопределена'), 'Undefined source state missing')
assert(panel.includes('REVIEW REQUIRED'), 'Review gate missing')
assert(panel.includes('не се използват за производство'), 'Non-production workspace boundary missing')
assert(panel.includes('prelude60-48221-mullion-clean.png'), '482.21 workspace asset missing')
assert(panel.includes('prelude60-48205-sash-clean.png'), '482.05 workspace asset missing')
assert(panel.includes('prelude60-48230-frame-clean.png'), '482.30 workspace asset missing')

assert(library.includes("CUSTOM_JOINT_LIBRARY_STORAGE_KEY = 'facadeflow.customJointLibrary.v1'"), 'Custom joint library storage key missing')
assert(library.includes("status: 'custom-draft'"), 'Custom draft-only persisted status missing')
assert(library.includes('saveCustomJointDraft'), 'Custom draft persistence missing')
assert(library.includes('deleteCustomJointDraft'), 'Custom draft delete missing')
assert(library.includes("if (args.exactGeometryVerified) return 'factory-verified'"), 'Verified geometry source status mapping missing')
assert(!library.includes("geometryStatus: 'available'"), 'Custom draft library must not unlock exact geometry')

assert(css.includes('JOINT SOURCE + CUSTOM ASSEMBLY 01'), 'FIX 37 CSS marker missing')
assert(css.includes('.assembly-custom-canvas'), 'Custom assembly canvas CSS missing')
assert(css.includes('.assembly-joint-source-grid'), 'Joint source state grid CSS missing')

const asset = path.join(root, 'src/assets/catalog/prelude60/prelude60-48221-mullion-clean.png')
assert(fs.existsSync(asset) && fs.statSync(asset).size > 500, '482.21 clean workspace asset missing or empty')

console.log('=== JOINT SOURCE + CUSTOM ASSEMBLY 01 VERIFY PASS ===')
console.log('SOURCE STATES: FACTORY / COMPANY / CUSTOM DRAFT / UNDEFINED')
console.log('CUSTOM DRAFT WORKSPACE: DRAG + ROTATE + SAVE + DELETE')
console.log('CUSTOM DRAFT PERSISTENCE: LOCAL LIBRARY')
console.log('CUSTOM DRAFT -> VERIFIED GEOMETRY AUTO-PROMOTION: NO')
console.log('PRODUCTION / BOM / MACHINE UNLOCK FROM DRAFT: NO')
console.log('MACHINE READY: NO')

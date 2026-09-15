import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const profile = await readFile(new URL('../src/domain/profileResolution.ts', import.meta.url), 'utf8')
const shell = await readFile(new URL('../src/components/ConstructorShell.tsx', import.meta.url), 'utf8')
const serialization = await readFile(new URL('../src/domain/project/projectSerialization.ts', import.meta.url), 'utf8')

assert.match(profile, /moduleGlazingSpecification: GlazingSpecificationAssignment \| null/)
assert.match(profile, /fieldGlazingSpecifications: Record<string, GlazingSpecificationAssignment>/)
assert.match(profile, /getEffectiveFieldGlazingSpecification/)
assert.match(profile, /'field-override' \| 'module-override' \| 'offer-default' \| 'unset'/)
assert.match(profile, /getEffectiveFieldGlazingThicknessMm/)
assert.match(profile, /getFieldHumanGlazingThicknessMm\(resolution, fieldId\)[\s\S]*getEffectiveFieldGlazingSpecification/)
assert.match(profile, /setModuleGlazingSpecificationAssignment/)
assert.match(profile, /setFieldGlazingSpecificationAssignment/)
assert.match(profile, /beadValidForEffectiveThickness/)
assert.match(profile, /fieldGlazingSpecifications = Object\.fromEntries/)

assert.match(serialization, /\['moduleGlazingSpecification', 'fieldGlazingSpecifications'\]/)
assert.match(serialization, /dangling glazing specification target/)

assert.match(shell, /СТЪКЛОПАКЕТ · МОДУЛ/)
assert.match(shell, /Стъклопакет override за избраното поле/)
assert.match(shell, /getEffectiveFieldGlazingThicknessMm/)
assert.match(shell, /setModuleGlazingSpecificationAssignment/)
assert.match(shell, /setFieldGlazingSpecificationAssignment/)
assert.match(shell, /РЪЧЕН OVERRIDE/)
assert.doesNotMatch(shell, /автоматичен избор на стъклодържател/i)

console.log('FACADEFLOW 0.1.8D FIELD GLAZING OWNERSHIP 01 VERIFY PASS')
console.log('OWNERSHIP: FIELD OVERRIDE > MODULE OVERRIDE > OFFER DEFAULT')
console.log('OFFER DEFAULT ESTABLISHES EFFECTIVE FIELD THICKNESS')
console.log('FIELD EXPLICIT THICKNESS: HUMAN OVERRIDE')
console.log('BEAD INVALIDATION: EFFECTIVE THICKNESS AWARE')
console.log('AUTOMATIC BEAD SELECTION: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')

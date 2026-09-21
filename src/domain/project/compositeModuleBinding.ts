import { validateCompositeModuleStructure } from '../compositeModuleStructure'
import { getProjectModuleSystemId, type ProjectModule } from './projectModel'

export class CompositeModuleBindingError extends Error {}

export function validateModuleCompositeStructure(module: ProjectModule): void {
  if (module.compositeStructure === undefined || module.compositeStructure === null) return
  validateCompositeModuleStructure(module.compositeStructure)
  if (module.compositeStructure.systemId !== getProjectModuleSystemId(module)) {
    throw new CompositeModuleBindingError('Системата на структурата трябва да съвпада със системата на модула.')
  }
}

export function guardCompositeSystemChange(previous: ProjectModule | undefined, next: ProjectModule): void {
  if (previous?.compositeStructure && getProjectModuleSystemId(previous) !== getProjectModuleSystemId(next)) {
    throw new CompositeModuleBindingError('Системата е заключена: модулът има запазена структура. Използвай отделен модул за друга система.')
  }
  validateModuleCompositeStructure(next)
}

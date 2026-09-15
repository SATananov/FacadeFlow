import {
  resolveConstructionTopology,
  setConstructionFieldOpeningHanding,
  setConstructionFieldOpeningMode,
  setConstructionFieldType,
  type ConstructionFieldType,
  type ConstructionModel,
  type ConstructionOpeningHanding,
  type ConstructionOpeningMode,
} from './construction'

export type FormFieldDescriptionInput = {
  sequence: number
  constructionFieldId: string | null
  fieldType: ConstructionFieldType | null
  fieldTypeSource: 'unset' | 'preset' | 'manual' | 'constructor'
  openingMode: ConstructionOpeningMode | null
  openingModeSource: 'unset' | 'preset' | 'manual' | 'constructor'
  openingHanding: ConstructionOpeningHanding | null
  openingHandingSource: 'unset' | 'preset' | 'manual' | 'constructor'
}

export function isPendingFormFieldDescription(description: FormFieldDescriptionInput): boolean {
  return (
    description.fieldTypeSource === 'preset' ||
    description.fieldTypeSource === 'manual' ||
    description.openingModeSource === 'preset' ||
    description.openingModeSource === 'manual' ||
    description.openingHandingSource === 'preset' ||
    description.openingHandingSource === 'manual'
  )
}

/**
 * Transfers only explicit canonical form semantics after the human-created
 * topology exposes the same FIELD count/identity. It never creates dividers,
 * dimensions, hinge geometry, profiles or other construction. Manual/custom
 * descriptions remain pending for explicit human resolution.
 */
export function transferFormFieldDescriptionsToConstruction(
  model: ConstructionModel,
  descriptions: readonly FormFieldDescriptionInput[],
): ConstructionModel {
  if (!descriptions.some(isPendingFormFieldDescription)) return model

  const resolved = resolveConstructionTopology(model).fields
  if (resolved.length !== descriptions.length) return model

  const byConstructionId = new Map(
    descriptions
      .filter((description) => description.constructionFieldId !== null)
      .map((description) => [description.constructionFieldId as string, description] as const),
  )
  const bySequence = new Map(descriptions.map((description) => [description.sequence, description] as const))
  let next = model

  for (const field of resolved) {
    const description = byConstructionId.get(field.id) ?? bySequence.get(field.sequence)
    if (!description) continue

    let current = resolveConstructionTopology(next).fields.find((item) => item.id === field.id)
    if (!current) continue

    if (current.fieldType === null && description.fieldTypeSource === 'preset' && description.fieldType !== null) {
      next = setConstructionFieldType(next, field.id, description.fieldType)
      current = resolveConstructionTopology(next).fields.find((item) => item.id === field.id)
    }

    if (
      current?.fieldType === 'operable' &&
      current.openingMode === null &&
      description.openingModeSource === 'preset' &&
      description.openingMode !== null
    ) {
      next = setConstructionFieldOpeningMode(next, field.id, description.openingMode)
      current = resolveConstructionTopology(next).fields.find((item) => item.id === field.id)
    }

    if (
      current?.fieldType === 'operable' &&
      (current.openingMode === 'side-hinged' || current.openingMode === 'tilt-turn') &&
      current.openingHanding === null &&
      description.openingHandingSource === 'preset' &&
      description.openingHanding !== null
    ) {
      next = setConstructionFieldOpeningHanding(next, field.id, description.openingHanding)
    }
  }

  return next
}

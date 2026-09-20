import {
  createFacadeModel, updateFacadeModel, validateFacadeModel,
  type FacadeModel, type FacadeModelInput,
} from '../domain/facadeModel'

export const MODEL_LIBRARY_STORAGE_KEY = 'facadeflow.model-library-01'
export const MODEL_LIBRARY_SCHEMA_VERSION = 1 as const
type ModelLibraryStorage = Pick<Storage, 'getItem' | 'setItem'>
type ModelLibraryEnvelope = { schemaVersion: typeof MODEL_LIBRARY_SCHEMA_VERSION; models: FacadeModel[] }

/** Independent of project snapshots. Reads never write or discard invalid data. */
export class LocalModelLibraryStorage {
  constructor(
    private readonly getStorage: () => ModelLibraryStorage,
    private readonly idFactory: () => string = () => globalThis.crypto.randomUUID(),
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  private read(storage: ModelLibraryStorage): ModelLibraryEnvelope {
    const json = storage.getItem(MODEL_LIBRARY_STORAGE_KEY)
    if (json === null) return { schemaVersion: MODEL_LIBRARY_SCHEMA_VERSION, models: [] }
    const envelope = JSON.parse(json) as ModelLibraryEnvelope
    if (!envelope || envelope.schemaVersion !== MODEL_LIBRARY_SCHEMA_VERSION || !Array.isArray(envelope.models)) {
      throw new Error('Неподдържана или повредена библиотека модели. Оригиналният запис е запазен.')
    }
    const ids = new Set<string>()
    for (const model of envelope.models) {
      validateFacadeModel(model)
      if (ids.has(model.id)) throw new Error('Повтаряща се идентичност в библиотеката модели.')
      ids.add(model.id)
    }
    return envelope
  }

  list(systemId?: string): FacadeModel[] {
    const { models } = this.read(this.getStorage())
    return systemId === undefined ? models : models.filter((model) => model.systemId === systemId)
  }

  getById(id: string): FacadeModel | null {
    return this.list().find((model) => model.id === id) ?? null
  }

  private requireModel(models: FacadeModel[], id: string): FacadeModel {
    const model = models.find((item) => item.id === id)
    if (!model) throw new Error('Моделът не е намерен. Обнови библиотеката.')
    return model
  }

  private append(storage: ModelLibraryStorage, envelope: ModelLibraryEnvelope, input: FacadeModelInput): FacadeModel {
    const model = createFacadeModel(input, this.idFactory(), this.now())
    if (envelope.models.some((item) => item.id === model.id)) throw new Error('Идентичността на новия модел вече съществува.')
    storage.setItem(MODEL_LIBRARY_STORAGE_KEY, JSON.stringify({ ...envelope, models: [...envelope.models, model] }))
    return model
  }

  create(input: FacadeModelInput): FacadeModel {
    const storage = this.getStorage()
    return this.append(storage, this.read(storage), input)
  }

  update(id: string, input: FacadeModelInput): FacadeModel {
    const storage = this.getStorage()
    const envelope = this.read(storage)
    const current = this.requireModel(envelope.models, id)
    const model = updateFacadeModel(current, input, this.now())
    storage.setItem(MODEL_LIBRARY_STORAGE_KEY, JSON.stringify({ ...envelope, models: envelope.models.map((item) => item.id === id ? model : item) }))
    return model
  }

  duplicate(id: string): FacadeModel {
    const storage = this.getStorage()
    const envelope = this.read(storage)
    const original = this.requireModel(envelope.models, id)
    return this.append(storage, envelope, { ...original, name: `${original.name} — копие` })
  }

  delete(id: string): void {
    const storage = this.getStorage()
    const envelope = this.read(storage)
    this.requireModel(envelope.models, id)
    storage.setItem(MODEL_LIBRARY_STORAGE_KEY, JSON.stringify({ ...envelope, models: envelope.models.filter((item) => item.id !== id) }))
  }
}

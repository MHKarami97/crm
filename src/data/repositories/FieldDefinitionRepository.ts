import { db } from '../AppDatabase'
import type { FieldDefinition } from '@/domain/models'

export class FieldDefinitionRepository {
  async getAll(includeArchived = false): Promise<FieldDefinition[]> {
    const list = await db.fieldDefinitions.toArray()
    const filtered = includeArchived ? list : list.filter((f) => !f.archived)
    return filtered.sort((a, b) => a.order - b.order)
  }

  async getBySection(
    section: 'people' | 'customer',
    includeArchived = false
  ): Promise<FieldDefinition[]> {
    const list = await db.fieldDefinitions.where('section').equals(section).toArray()
    const filtered = includeArchived ? list : list.filter((f) => !f.archived)
    return filtered.sort((a, b) => a.order - b.order)
  }

  async getByKey(key: string): Promise<FieldDefinition | undefined> {
    return db.fieldDefinitions.where('key').equals(key).first()
  }

  async create(definition: FieldDefinition): Promise<string> {
    const count = await db.fieldDefinitions.count()
    if (!definition.order) definition.order = count + 1
    await db.fieldDefinitions.add(definition)
    return definition.id
  }

  async update(definition: FieldDefinition): Promise<void> {
    await db.fieldDefinitions.put(definition)
  }

  async archive(id: string): Promise<void> {
    await db.fieldDefinitions.update(id, { archived: true })
  }

  async restore(id: string): Promise<void> {
    await db.fieldDefinitions.update(id, { archived: false })
  }

  async delete(id: string): Promise<void> {
    // Only allow permanent deletion if custom (not builtin)
    const field = await db.fieldDefinitions.get(id)
    if (field && !field.builtin) {
      await db.fieldDefinitions.delete(id)
    } else if (field) {
      await this.archive(id)
    }
  }

  async bulkAdd(fields: FieldDefinition[]): Promise<void> {
    await db.fieldDefinitions.bulkPut(fields)
  }
}

export const fieldDefinitionRepository = new FieldDefinitionRepository()

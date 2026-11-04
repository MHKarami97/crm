import { db } from '../AppDatabase'
import type { Relationship } from '@/domain/models'
import { toCleanData } from '@/utils/cleanData'

export class RelationshipRepository {
  async getAll(): Promise<Relationship[]> {
    return db.relationships.toArray()
  }

  async getById(id: string): Promise<Relationship | undefined> {
    return db.relationships.get(id)
  }

  async getByPersonId(personId: string): Promise<Relationship[]> {
    return db.relationships
      .filter((r) => r.sourcePersonId === personId || r.targetPersonId === personId)
      .toArray()
  }

  async findExisting(
    sourceId: string,
    targetId: string,
    type?: string
  ): Promise<Relationship | undefined> {
    return db.relationships
      .filter(
        (r) =>
          ((r.sourcePersonId === sourceId && r.targetPersonId === targetId) ||
            (r.sourcePersonId === targetId && r.targetPersonId === sourceId)) &&
          (!type || r.type === type)
      )
      .first()
  }

  async create(relationship: Relationship): Promise<string> {
    const cleanRel = toCleanData(relationship)
    await db.relationships.add(cleanRel)
    return cleanRel.id
  }

  async update(relationship: Relationship): Promise<void> {
    relationship.updatedAt = new Date().toISOString()
    const cleanRel = toCleanData(relationship)
    await db.relationships.put(cleanRel)
  }

  async delete(id: string): Promise<void> {
    await db.relationships.delete(id)
  }

  async bulkAdd(relationships: Relationship[]): Promise<void> {
    const cleanList = toCleanData(relationships)
    await db.relationships.bulkPut(cleanList)
  }

  async count(): Promise<number> {
    return db.relationships.count()
  }
}

export const relationshipRepository = new RelationshipRepository()

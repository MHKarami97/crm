import { db } from '../AppDatabase'
import type { Tag } from '@/domain/models'
import { toCleanData } from '@/utils/cleanData'

const TAG_PALETTE = [
  '#0d9488', // Teal
  '#2563eb', // Blue
  '#db2777', // Pink
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#059669', // Emerald
  '#ea580c', // Orange
  '#475569', // Slate
]

export class TagRepository {
  async getAll(): Promise<Tag[]> {
    return db.tags.orderBy('name').toArray()
  }

  async getOrCreate(name: string): Promise<Tag> {
    const trimmed = name.trim()
    const existing = await db.tags.where('name').equalsIgnoreCase(trimmed).first()
    if (existing) return existing

    const count = await db.tags.count()
    const color = TAG_PALETTE[count % TAG_PALETTE.length]
    const newTag: Tag = {
      id: 'tag-' + Math.random().toString(36).substring(2, 9),
      name: trimmed,
      color,
    }
    await db.tags.add(toCleanData(newTag))
    return newTag
  }

  async create(tag: Tag): Promise<string> {
    const cleanTag = toCleanData(tag)
    await db.tags.add(cleanTag)
    return cleanTag.id
  }

  async delete(id: string): Promise<void> {
    await db.tags.delete(id)
  }

  async bulkAdd(tags: Tag[]): Promise<void> {
    await db.tags.bulkPut(toCleanData(tags))
  }
}

export const tagRepository = new TagRepository()

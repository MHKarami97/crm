import { db } from '../AppDatabase'
import type { Person } from '@/domain/models'
import { toCleanData } from '@/utils/cleanData'

export class PersonRepository {
  async getAll(includeArchived = false): Promise<Person[]> {
    if (includeArchived) {
      return db.people.orderBy('name').toArray()
    }
    return db.people.filter((p) => !p.archived).toArray()
  }

  async getById(id: string): Promise<Person | undefined> {
    return db.people.get(id)
  }

  async create(person: Person): Promise<string> {
    const cleanPerson = toCleanData(person)
    await db.people.add(cleanPerson)
    return cleanPerson.id
  }

  async update(person: Person): Promise<void> {
    person.updatedAt = new Date().toISOString()
    const cleanPerson = toCleanData(person)
    await db.people.put(cleanPerson)
  }

  async archive(id: string): Promise<void> {
    await db.people.update(id, { archived: true, updatedAt: new Date().toISOString() })
  }

  async restore(id: string): Promise<void> {
    await db.people.update(id, { archived: false, updatedAt: new Date().toISOString() })
  }

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.people, db.relationships], async () => {
      // Cascade delete relationships involving this person
      await db.relationships
        .where('sourcePersonId')
        .equals(id)
        .or('targetPersonId')
        .equals(id)
        .delete()
      await db.people.delete(id)
    })
  }

  async bulkAdd(people: Person[]): Promise<void> {
    const cleanList = toCleanData(people)
    await db.people.bulkPut(cleanList)
  }

  async count(): Promise<number> {
    return db.people.count()
  }

  async search(query: string, tagFilter?: string[]): Promise<Person[]> {
    const q = query.trim().toLowerCase()

    let collection = db.people.filter((p) => {
      if (p.archived) return false

      if (tagFilter && tagFilter.length > 0) {
        const hasTag = tagFilter.some((t) => p.tags.includes(t))
        if (!hasTag) return false
      }

      if (!q) return true

      // Match name
      if (p.name.toLowerCase().includes(q)) return true

      // Match phones
      if (p.phones.some((phone) => phone.includes(q))) return true

      // Match emails
      if (p.emails.some((email) => email.toLowerCase().includes(q))) return true

      // Match notes
      if (p.notes && p.notes.toLowerCase().includes(q)) return true

      // Match custom fields string values
      if (p.customFields) {
        for (const val of Object.values(p.customFields)) {
          if (typeof val === 'string' && val.toLowerCase().includes(q)) return true
        }
      }

      return false
    })

    return collection.toArray()
  }
}

export const personRepository = new PersonRepository()

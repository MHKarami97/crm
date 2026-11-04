import Dexie, { type EntityTable } from 'dexie'
import type {
  Person,
  Relationship,
  FieldDefinition,
  Tag,
  Interaction,
  CustomerProfile,
  CustomerVisit,
} from '@/domain/models'
import { DEFAULT_FIELD_DEFINITIONS } from './defaultFields'

export interface SettingRecord {
  id: string
  value: any
  updatedAt: string
}

export class AppDatabase extends Dexie {
  people!: EntityTable<Person, 'id'>
  relationships!: EntityTable<Relationship, 'id'>
  fieldDefinitions!: EntityTable<FieldDefinition, 'id'>
  tags!: EntityTable<Tag, 'id'>
  interactions!: EntityTable<Interaction, 'id'>
  customerProfiles!: EntityTable<CustomerProfile, 'id'>
  customerVisits!: EntityTable<CustomerVisit, 'id'>
  settings!: EntityTable<SettingRecord, 'id'>

  constructor() {
    super('PersonalCrmDB')

    // Schema Version 1
    this.version(1).stores({
      people: 'id, name, createdAt, updatedAt, *tags, archived',
      relationships: 'id, sourcePersonId, targetPersonId, type, strength, createdAt',
      fieldDefinitions: 'id, key, group, section, order, archived',
      tags: 'id, name',
      interactions: 'id, personId, type, date, createdAt',
      customerProfiles: 'id, personId, businessType, lastVisitDate',
      settings: 'id',
    })

    // Schema Version 2
    this.version(2).stores({
      customerVisits: 'id, personId, customerProfileId, date, nextDueDate, createdAt',
    })

    // Seed default definitions when database is first created
    this.on('populate', async () => {
      await this.fieldDefinitions.bulkAdd(DEFAULT_FIELD_DEFINITIONS)
      await this.tags.bulkAdd([
        { id: 'tag-friend', name: 'دوست', color: '#0d9488' },
        { id: 'tag-work', name: 'کاری', color: '#2563eb' },
        { id: 'tag-family', name: 'خانواده', color: '#db2777' },
        { id: 'tag-client', name: 'مشتری', color: '#d97706' },
      ])
      await this.settings.bulkAdd([
        { id: 'theme', value: 'system', updatedAt: new Date().toISOString() },
        { id: 'autoLockMinutes', value: 15, updatedAt: new Date().toISOString() },
        { id: 'securityEnabled', value: false, updatedAt: new Date().toISOString() },
      ])
    })
  }
}

export const db = new AppDatabase()

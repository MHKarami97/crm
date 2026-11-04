import type { Person, Relationship, FieldDefinition, Tag, Interaction, CustomerProfile } from './models'

export interface BackupPayload {
  format: 'crm-local-backup'
  version: '1.0'
  exportedAt: string
  stats: {
    peopleCount: number
    relationshipsCount: number
    fieldsCount: number
    tagsCount: number
    interactionsCount: number
    customerProfilesCount: number
  }
  people: Person[]
  relationships: Relationship[]
  fields: FieldDefinition[]
  tags: Tag[]
  interactions: Interaction[]
  customerProfiles: CustomerProfile[]
  settings: Record<string, any>
}

export interface EncryptedBackupContainer {
  format: 'crm-encrypted-backup'
  version: '1.0'
  algorithm: 'AES-GCM'
  kdf: 'PBKDF2'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
  checksum: string
  meta: {
    createdAt: string
    approxPeopleCount: number
    approxRelationshipsCount: number
    source: 'local' | 'cloud'
  }
}

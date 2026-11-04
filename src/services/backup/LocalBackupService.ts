import { db } from '@/data/AppDatabase'
import { personRepository } from '@/data/repositories/PersonRepository'
import { relationshipRepository } from '@/data/repositories/RelationshipRepository'
import { fieldDefinitionRepository } from '@/data/repositories/FieldDefinitionRepository'
import { tagRepository } from '@/data/repositories/TagRepository'
import { settingRepository } from '@/data/repositories/SettingRepository'
import type { BackupPayload, EncryptedBackupContainer } from '@/domain/backup'
import {
  encryptAesGcm,
  decryptAesGcm,
  hashSha256,
} from '@/utils/crypto'

export interface BackupInspection {
  isValid: boolean
  isEncrypted: boolean
  peopleCount: number
  relationshipsCount: number
  exportedAt: string
  payload?: BackupPayload
  errorMessage?: string
}

export class LocalBackupService {
  async buildPayload(): Promise<BackupPayload> {
    const people = await personRepository.getAll(true)
    const relationships = await relationshipRepository.getAll()
    const fields = await fieldDefinitionRepository.getAll(true)
    const tags = await tagRepository.getAll()
    const interactions = await db.interactions.toArray()
    const customerProfiles = await db.customerProfiles.toArray()
    const settings = await settingRepository.getAll()

    // Exclude security secrets from exported settings
    delete settings.passcodeHash
    delete settings.passcodeSalt
    delete settings.recoveryKeyHash
    delete settings.recoveryKeySalt
    delete settings.biometricCredentialId

    return {
      format: 'crm-local-backup',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      stats: {
        peopleCount: people.length,
        relationshipsCount: relationships.length,
        fieldsCount: fields.length,
        tagsCount: tags.length,
        interactionsCount: interactions.length,
        customerProfilesCount: customerProfiles.length,
      },
      people,
      relationships,
      fields,
      tags,
      interactions,
      customerProfiles,
      settings,
    }
  }

  async exportBackup(password?: string): Promise<Blob> {
    const payload = await this.buildPayload()
    const jsonString = JSON.stringify(payload)
    const checksum = await hashSha256(jsonString)

    if (password && password.length >= 4) {
      const { ciphertext, salt, iv, iterations } = await encryptAesGcm(jsonString, password)
      const container: EncryptedBackupContainer = {
        format: 'crm-encrypted-backup',
        version: '1.0',
        algorithm: 'AES-GCM',
        kdf: 'PBKDF2',
        iterations,
        salt,
        iv,
        ciphertext,
        checksum,
        meta: {
          createdAt: payload.exportedAt,
          approxPeopleCount: payload.stats.peopleCount,
          approxRelationshipsCount: payload.stats.relationshipsCount,
          source: 'local',
        },
      }
      return new Blob([JSON.stringify(container, null, 2)], { type: 'application/json' })
    }

    return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  }

  async inspectBackup(content: string): Promise<BackupInspection> {
    try {
      const parsed = JSON.parse(content)
      if (parsed.format === 'crm-encrypted-backup') {
        return {
          isValid: true,
          isEncrypted: true,
          peopleCount: parsed.meta?.approxPeopleCount || 0,
          relationshipsCount: parsed.meta?.approxRelationshipsCount || 0,
          exportedAt: parsed.meta?.createdAt || new Date().toISOString(),
        }
      }

      if (parsed.format === 'crm-local-backup' || Array.isArray(parsed.people)) {
        return {
          isValid: true,
          isEncrypted: false,
          peopleCount: parsed.people?.length || 0,
          relationshipsCount: parsed.relationships?.length || 0,
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          payload: parsed,
        }
      }

      return {
        isValid: false,
        isEncrypted: false,
        peopleCount: 0,
        relationshipsCount: 0,
        exportedAt: '',
        errorMessage: 'فرمت فایل پشتیبان شناسایی نشد.',
      }
    } catch {
      return {
        isValid: false,
        isEncrypted: false,
        peopleCount: 0,
        relationshipsCount: 0,
        exportedAt: '',
        errorMessage: 'محتوای فایل JSON معتبر نیست.',
      }
    }
  }

  async restoreBackup(content: string, password?: string): Promise<void> {
    const parsed = JSON.parse(content)
    let payload: BackupPayload

    if (parsed.format === 'crm-encrypted-backup') {
      if (!password) {
        throw new Error('برای باز کردن این فایل پشتیبان، وارد کردن رمز عبور الزامی است.')
      }
      const container = parsed as EncryptedBackupContainer
      const decryptedJson = await decryptAesGcm(
        container.ciphertext,
        password,
        container.salt,
        container.iv,
        container.iterations
      )

      const computedChecksum = await hashSha256(decryptedJson)
      if (computedChecksum !== container.checksum) {
        throw new Error('رمز عبور اشتباه است یا فایل پشتیبان دستکاری شده است.')
      }
      payload = JSON.parse(decryptedJson)
    } else if (parsed.format === 'crm-local-backup' || Array.isArray(parsed.people)) {
      payload = parsed as BackupPayload
    } else {
      throw new Error('فرمت فایل پشتیبان معتبر نیست.')
    }

    // Atomic restore transaction in Dexie
    await db.transaction(
      'rw',
      [
        db.people,
        db.relationships,
        db.fieldDefinitions,
        db.tags,
        db.interactions,
        db.customerProfiles,
        db.settings,
      ],
      async () => {
        if (payload.people && payload.people.length > 0) {
          await db.people.clear()
          await db.people.bulkAdd(payload.people)
        }
        if (payload.relationships && payload.relationships.length > 0) {
          await db.relationships.clear()
          await db.relationships.bulkAdd(payload.relationships)
        }
        if (payload.fields && payload.fields.length > 0) {
          await db.fieldDefinitions.clear()
          await db.fieldDefinitions.bulkAdd(payload.fields)
        }
        if (payload.tags && payload.tags.length > 0) {
          await db.tags.clear()
          await db.tags.bulkAdd(payload.tags)
        }
        if (payload.interactions && payload.interactions.length > 0) {
          await db.interactions.clear()
          await db.interactions.bulkAdd(payload.interactions)
        }
        if (payload.customerProfiles && payload.customerProfiles.length > 0) {
          await db.customerProfiles.clear()
          await db.customerProfiles.bulkAdd(payload.customerProfiles)
        }
      }
    )
  }
}

export const localBackupService = new LocalBackupService()

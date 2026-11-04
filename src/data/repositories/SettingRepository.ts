import { db, type SettingRecord } from '../AppDatabase'

export class SettingRepository {
  async get<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
    const record = await db.settings.get(key)
    if (!record) return defaultValue
    return record.value as T
  }

  async set(key: string, value: any): Promise<void> {
    await db.settings.put({
      id: key,
      value,
      updatedAt: new Date().toISOString(),
    })
  }

  async getAll(): Promise<Record<string, any>> {
    const records = await db.settings.toArray()
    const result: Record<string, any> = {}
    records.forEach((r) => {
      result[r.id] = r.value
    })
    return result
  }

  async bulkSet(map: Record<string, any>): Promise<void> {
    const records: SettingRecord[] = Object.entries(map).map(([key, value]) => ({
      id: key,
      value,
      updatedAt: new Date().toISOString(),
    }))
    await db.settings.bulkPut(records)
  }
}

export const settingRepository = new SettingRepository()

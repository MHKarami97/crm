export interface StorageStatus {
  isPersisted: boolean
  usageBytes: number
  quotaBytes: number
  usagePercent: number
  isSupported: boolean
}

export class StoragePersistenceService {
  async isPersisted(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      return navigator.storage.persisted()
    }
    return false
  }

  async requestPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const persisted = await navigator.storage.persist()
        return persisted
      } catch (err) {
        console.warn('Storage persist request failed:', err)
        return false
      }
    }
    return false
  }

  async getStatus(): Promise<StorageStatus> {
    if (typeof navigator === 'undefined' || !navigator.storage) {
      return {
        isPersisted: false,
        usageBytes: 0,
        quotaBytes: 0,
        usagePercent: 0,
        isSupported: false,
      }
    }

    let isPersisted = false
    try {
      if (navigator.storage.persisted) {
        isPersisted = await navigator.storage.persisted()
      }
    } catch {
      isPersisted = false
    }

    let usageBytes = 0
    let quotaBytes = 0
    let usagePercent = 0

    try {
      if (navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate()
        usageBytes = estimate.usage || 0
        quotaBytes = estimate.quota || 0
        if (quotaBytes > 0) {
          usagePercent = Math.round((usageBytes / quotaBytes) * 100)
        }
      }
    } catch {
      // Estimate error fallback
    }

    return {
      isPersisted,
      usageBytes,
      quotaBytes,
      usagePercent,
      isSupported: true,
    }
  }
}

export const storagePersistenceService = new StoragePersistenceService()

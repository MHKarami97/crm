import { defineStore } from 'pinia'
import { ref } from 'vue'
import { googleAuthService } from '@/services/backup/GoogleAuthService'
import { driveAppDataClient, type RemoteBackupInfo } from '@/services/backup/DriveAppDataClient'
import { localBackupService } from '@/services/backup/LocalBackupService'
import { useSettingsStore } from './useSettingsStore'
import { formatShamsiDate } from '@/utils/jalali'

export const useCloudSyncStore = defineStore('cloudSync', () => {
  const isAuthorized = ref<boolean>(false)
  const isSyncing = ref<boolean>(false)
  const remoteBackups = ref<RemoteBackupInfo[]>([])
  const errorMessage = ref<string | null>(null)

  async function checkAuth() {
    isAuthorized.value = googleAuthService.isAuthorized
  }

  async function connectGoogle(mode: 'interactive' | 'silent' = 'interactive'): Promise<boolean> {
    isSyncing.value = true
    errorMessage.value = null
    try {
      const ok = await googleAuthService.requestAccess(mode)
      isAuthorized.value = ok
      if (ok) {
        await listBackups()
      }
      return ok
    } catch (err: any) {
      errorMessage.value = err.message || 'خطا در ارتباط با حساب گوگل'
      return false
    } finally {
      isSyncing.value = false
    }
  }

  async function disconnectGoogle(): Promise<void> {
    await googleAuthService.revoke()
    isAuthorized.value = false
    remoteBackups.value = []
  }

  async function listBackups(): Promise<RemoteBackupInfo[]> {
    if (!isAuthorized.value) return []
    isSyncing.value = true
    try {
      remoteBackups.value = await driveAppDataClient.list()
      return remoteBackups.value
    } catch (err: any) {
      errorMessage.value = err.message
      return []
    } finally {
      isSyncing.value = false
    }
  }

  async function uploadBackup(passphrase?: string): Promise<boolean> {
    if (!isAuthorized.value) {
      const ok = await connectGoogle('interactive')
      if (!ok) return false
    }

    isSyncing.value = true
    errorMessage.value = null
    try {
      const blob = await localBackupService.exportBackup(passphrase)
      const text = await blob.text()
      const nowStr = new Date().toISOString()
      const fileName = `personal-crm.backup.${nowStr}.json`

      await driveAppDataClient.create(fileName, text, {
        exportedAt: nowStr,
        isEncrypted: passphrase ? 'true' : 'false',
      })

      const settingsStore = useSettingsStore()
      await settingsStore.updateSetting('lastBackupDate', nowStr)

      // Prune old backups, keep last 3
      const list = await driveAppDataClient.list()
      if (list.length > 3) {
        for (let i = 3; i < list.length; i++) {
          await driveAppDataClient.remove(list[i].id)
        }
      }

      await listBackups()
      return true
    } catch (err: any) {
      errorMessage.value = err.message || 'خطا در بارگذاری پشتیبان در گوگل درایو'
      return false
    } finally {
      isSyncing.value = false
    }
  }

  async function restoreFromRemote(fileId: string, passphrase?: string): Promise<boolean> {
    isSyncing.value = true
    errorMessage.value = null
    try {
      const content = await driveAppDataClient.read(fileId)
      await localBackupService.restoreBackup(content, passphrase)
      return true
    } catch (err: any) {
      errorMessage.value = err.message || 'خطا در بازیابی نسخه پشتیبان'
      return false
    } finally {
      isSyncing.value = false
    }
  }

  return {
    isAuthorized,
    isSyncing,
    remoteBackups,
    errorMessage,
    checkAuth,
    connectGoogle,
    disconnectGoogle,
    listBackups,
    uploadBackup,
    restoreFromRemote,
  }
})

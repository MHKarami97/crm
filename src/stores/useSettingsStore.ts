import { defineStore } from 'pinia'
import { ref } from 'vue'
import { settingRepository } from '@/data/repositories/SettingRepository'
import { storagePersistenceService, type StorageStatus } from '@/services/storage/StoragePersistenceService'

export type ThemeMode = 'system' | 'light' | 'dark'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeMode>('system')
  const autoLockMinutes = ref<number>(15)
  const securityEnabled = ref<boolean>(false)
  const lastBackupDate = ref<string | null>(null)
  const storageStatus = ref<StorageStatus | null>(null)

  async function loadSettings() {
    const t = await settingRepository.get<ThemeMode>('theme', 'system')
    if (t) theme.value = t

    const lock = await settingRepository.get<number>('autoLockMinutes', 15)
    if (lock) autoLockMinutes.value = lock

    const sec = await settingRepository.get<boolean>('securityEnabled', false)
    securityEnabled.value = !!sec

    const lastBkp = await settingRepository.get<string>('lastBackupDate')
    if (lastBkp) lastBackupDate.value = lastBkp

    applyTheme()
    await refreshStorageStatus()
  }

  async function setTheme(newTheme: ThemeMode) {
    theme.value = newTheme
    await settingRepository.set('theme', newTheme)
    applyTheme()
  }

  function applyTheme() {
    const isDark =
      theme.value === 'dark' ||
      (theme.value === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)

    if (typeof document !== 'undefined') {
      const html = document.documentElement
      if (isDark) {
        html.setAttribute('data-theme', 'dark')
        html.classList.add('dark')
      } else {
        html.setAttribute('data-theme', 'light')
        html.classList.remove('dark')
      }
    }
  }

  async function updateSetting(key: string, value: any) {
    await settingRepository.set(key, value)
    if (key === 'autoLockMinutes') autoLockMinutes.value = value
    if (key === 'securityEnabled') securityEnabled.value = value
    if (key === 'lastBackupDate') lastBackupDate.value = value
  }

  async function refreshStorageStatus() {
    storageStatus.value = await storagePersistenceService.getStatus()
  }

  async function requestStoragePersistence() {
    const success = await storagePersistenceService.requestPersistence()
    await refreshStorageStatus()
    return success
  }

  return {
    theme,
    autoLockMinutes,
    securityEnabled,
    lastBackupDate,
    storageStatus,
    loadSettings,
    setTheme,
    applyTheme,
    updateSetting,
    refreshStorageStatus,
    requestStoragePersistence,
  }
})

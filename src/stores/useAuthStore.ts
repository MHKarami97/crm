import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { settingRepository } from '@/data/repositories/SettingRepository'
import {
  hashPasscode,
  verifyPasscode,
  generateRecoveryKey,
} from '@/utils/crypto'
import { biometricService } from '@/services/auth/BiometricService'
import { unlockSessionService } from '@/services/auth/UnlockSessionService'

const COOLDOWN_THRESHOLD = 3
const COOLDOWN_MS = 30000

export const useAuthStore = defineStore('auth', () => {
  const isUnlocked = ref<boolean>(unlockSessionService.isActive())
  const securityEnabled = ref<boolean>(false)
  const hasPasscode = ref<boolean>(false)
  const biometricEnabled = ref<boolean>(false)
  const biometricAvailable = ref<boolean>(false)

  const failedAttempts = ref<number>(0)
  const cooldownUntil = ref<number | null>(null)

  const isLocked = computed(() => {
    if (!securityEnabled.value) return false
    return !isUnlocked.value
  })

  const isCooldownActive = computed(() => {
    if (!cooldownUntil.value) return false
    return Date.now() < cooldownUntil.value
  })

  const remainingCooldownSeconds = computed(() => {
    if (!cooldownUntil.value) return 0
    const diff = Math.ceil((cooldownUntil.value - Date.now()) / 1000)
    return diff > 0 ? diff : 0
  })

  async function initAuth() {
    const sec = await settingRepository.get<boolean>('securityEnabled', false)
    securityEnabled.value = !!sec

    const hash = await settingRepository.get<string>('passcodeHash')
    hasPasscode.value = !!hash

    const bio = await settingRepository.get<boolean>('biometricEnabled', false)
    biometricEnabled.value = !!bio

    biometricAvailable.value = await biometricService.isBiometricAvailable()

    const lockMins = await settingRepository.get<number>('autoLockMinutes', 15)
    unlockSessionService.setAutoLockMinutes(lockMins || 15)

    isUnlocked.value = !securityEnabled.value || unlockSessionService.isActive()

    // Bind visibilitychange listener to lock or hide content when app goes background
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && securityEnabled.value) {
          // Record background timestamp or lock
          unlockSessionService.recordActivity()
        }
      })
    }
  }

  function markUnlocked() {
    isUnlocked.value = true
    failedAttempts.value = 0
    cooldownUntil.value = null
    unlockSessionService.start()
  }

  function lock() {
    isUnlocked.value = false
    unlockSessionService.clear()
  }

  async function unlockWithPasscode(passcode: string): Promise<boolean> {
    if (isCooldownActive.value) {
      throw new Error(`تلاش‌های ناموفق بیش از حد؛ ${remainingCooldownSeconds.value} ثانیه صبر کنید.`)
    }

    const storedHash = await settingRepository.get<string>('passcodeHash')
    const storedSalt = await settingRepository.get<string>('passcodeSalt')

    if (!storedHash || !storedSalt) {
      markUnlocked()
      return true
    }

    const valid = await verifyPasscode(passcode, storedHash, storedSalt)
    if (valid) {
      markUnlocked()
      return true
    }

    failedAttempts.value++
    if (failedAttempts.value >= COOLDOWN_THRESHOLD) {
      cooldownUntil.value = Date.now() + COOLDOWN_MS
    }
    return false
  }

  async function unlockWithBiometric(): Promise<boolean> {
    if (!biometricEnabled.value) return false
    const credentialId = await settingRepository.get<string>('biometricCredentialId')
    const verified = await biometricService.verifyBiometric(credentialId)
    if (verified) {
      markUnlocked()
      return true
    }
    return false
  }

  async function setPasscode(newPasscode: string): Promise<string> {
    const { hash, salt } = await hashPasscode(newPasscode)
    await settingRepository.set('passcodeHash', hash)
    await settingRepository.set('passcodeSalt', salt)
    await settingRepository.set('securityEnabled', true)

    // Generate emergency recovery key
    const recoveryKey = generateRecoveryKey()
    const recHash = await hashPasscode(recoveryKey, salt)
    await settingRepository.set('recoveryKeyHash', recHash.hash)

    hasPasscode.value = true
    securityEnabled.value = true
    markUnlocked()

    return recoveryKey
  }

  async function recoverWithKey(recoveryKey: string, newPasscode: string): Promise<boolean> {
    const cleanKey = recoveryKey.trim().toUpperCase()
    const storedHash = await settingRepository.get<string>('recoveryKeyHash')
    const storedSalt = await settingRepository.get<string>('passcodeSalt')

    if (!storedHash || !storedSalt) return false

    const valid = await verifyPasscode(cleanKey, storedHash, storedSalt)
    if (valid) {
      await setPasscode(newPasscode)
      return true
    }
    return false
  }

  async function enableBiometric(): Promise<void> {
    const { credentialId } = await biometricService.registerBiometric()
    await settingRepository.set('biometricCredentialId', credentialId)
    await settingRepository.set('biometricEnabled', true)
    biometricEnabled.value = true
  }

  async function disableBiometric(): Promise<void> {
    await settingRepository.set('biometricEnabled', false)
    await settingRepository.set('biometricCredentialId', null)
    biometricEnabled.value = false
  }

  async function disableSecurity(): Promise<void> {
    await settingRepository.set('securityEnabled', false)
    await settingRepository.set('passcodeHash', null)
    await settingRepository.set('passcodeSalt', null)
    await settingRepository.set('recoveryKeyHash', null)
    await disableBiometric()

    securityEnabled.value = false
    hasPasscode.value = false
    isUnlocked.value = true
  }

  return {
    isUnlocked,
    isLocked,
    securityEnabled,
    hasPasscode,
    biometricEnabled,
    biometricAvailable,
    isCooldownActive,
    remainingCooldownSeconds,
    initAuth,
    markUnlocked,
    lock,
    unlockWithPasscode,
    unlockWithBiometric,
    setPasscode,
    recoverWithKey,
    enableBiometric,
    disableBiometric,
    disableSecurity,
  }
})

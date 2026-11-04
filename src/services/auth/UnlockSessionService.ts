const STORAGE_KEY = 'crm.session.unlocked'
const LAST_ACTIVE_KEY = 'crm.session.lastActive'

export class UnlockSessionService {
  private autoLockMinutes = 15

  setAutoLockMinutes(minutes: number) {
    this.autoLockMinutes = minutes
  }

  start() {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    this.recordActivity()
  }

  clear() {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(LAST_ACTIVE_KEY)
  }

  recordActivity() {
    sessionStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()))
  }

  isActive(): boolean {
    const isUnlocked = sessionStorage.getItem(STORAGE_KEY) === 'true'
    if (!isUnlocked) return false

    const lastActiveStr = sessionStorage.getItem(LAST_ACTIVE_KEY)
    if (!lastActiveStr) return false

    const lastActive = parseInt(lastActiveStr, 10)
    const timeoutMs = this.autoLockMinutes * 60 * 1000

    if (Date.now() - lastActive > timeoutMs) {
      this.clear()
      return false
    }

    return true
  }
}

export const unlockSessionService = new UnlockSessionService()

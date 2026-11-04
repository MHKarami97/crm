import { CloudSyncError } from './CloudSyncError'
import { googleIdentityLoader } from './GoogleIdentityLoader'

export type AccessMode = 'interactive' | 'silent'

interface TokenResponse {
  access_token?: string
  expires_in?: number | string
  error?: string
  error_description?: string
}

const EXPIRY_SAFETY_MS = 60 * 1000
const SILENT_TIMEOUT_MS = 15 * 1000

export class GoogleAuthService {
  private tokenClient: any = null
  private accessToken: string | null = null
  private expiresAt = 0
  private pending: Promise<boolean> | null = null

  constructor(
    private readonly clientId: string = '627723972815-qrp35936cvbodbo2udkp4qeeh6sgoqms.apps.googleusercontent.com',
    private readonly scope: string = 'https://www.googleapis.com/auth/drive.appdata'
  ) {}

  get isAuthorized(): boolean {
    return this.accessToken !== null && Date.now() < this.expiresAt
  }

  getToken(): string {
    if (!this.isAuthorized) {
      throw new CloudSyncError('AUTH', 'نشست Google منقضی شده است؛ لطفاً دوباره متصل شوید.')
    }
    return this.accessToken as string
  }

  clear(): void {
    this.accessToken = null
    this.expiresAt = 0
  }

  async requestAccess(mode: AccessMode): Promise<boolean> {
    if (this.pending) return this.pending
    this.pending = this.runRequest(mode).finally(() => {
      this.pending = null
    })
    return this.pending
  }

  async revoke(): Promise<void> {
    const token = this.accessToken
    this.clear()
    if (!token) return
    await googleIdentityLoader.load()
    await new Promise<void>((resolve) => {
      ;(window as any).google?.accounts?.oauth2?.revoke(token, () => resolve())
    })
  }

  private async runRequest(mode: AccessMode): Promise<boolean> {
    await googleIdentityLoader.load()
    const oauth2 = (window as any).google?.accounts?.oauth2
    if (!oauth2) {
      throw new CloudSyncError('AUTH', 'ماژول احراز هویت گوگل در دسترس نیست.')
    }

    return new Promise<boolean>((resolveRaw) => {
      let settled = false
      let timer: number | undefined

      const resolve = (value: boolean) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        resolveRaw(value)
      }

      if (mode === 'silent') {
        timer = window.setTimeout(() => resolve(false), SILENT_TIMEOUT_MS)
      }

      this.tokenClient = oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scope,
        callback: (response: TokenResponse) => {
          if (response.error || !response.access_token) return resolve(false)
          if (!oauth2.hasGrantedAllScopes(response, this.scope)) return resolve(false)
          this.accessToken = response.access_token
          this.expiresAt =
            Date.now() + Number(response.expires_in || 0) * 1000 - EXPIRY_SAFETY_MS
          resolve(true)
        },
        error_callback: () => resolve(false),
      })

      this.tokenClient.requestAccessToken(mode === 'silent' ? { prompt: 'none' } : {})
    })
  }
}

export const googleAuthService = new GoogleAuthService()

import { CloudSyncError } from './CloudSyncError'

const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

export class GoogleIdentityLoader {
  private promise: Promise<void> | null = null

  load(): Promise<void> {
    if (this.isLoaded()) return Promise.resolve()
    if (this.promise) return this.promise

    this.promise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`)
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener(
          'error',
          () => reject(new CloudSyncError('NETWORK', 'خطا در بارگذاری کتابخانه احراز هویت گوگل')),
          { once: true }
        )
        return
      }

      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () =>
        reject(
          new CloudSyncError(
            'NETWORK',
            'دسترسی به سرور گوگل مسدود است؛ لطفاً اتصال اینترنت خود را بررسی کنید.'
          )
        )
      document.head.appendChild(script)
    })

    return this.promise
  }

  isLoaded(): boolean {
    return typeof window !== 'undefined' && !!(window as any).google?.accounts?.oauth2
  }
}

export const googleIdentityLoader = new GoogleIdentityLoader()

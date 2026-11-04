import { bufferToHex, getRandomBytes } from '@/utils/crypto'

export class BiometricService {
  async isBiometricAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return false
    }
  }

  async registerBiometric(): Promise<{ credentialId: string }> {
    if (!window.PublicKeyCredential) {
      throw new Error('دستگاه یا مرورگر شما از قابلیت ورود بیومتریک پشتیبانی نمی‌کند.')
    }

    const challenge = getRandomBytes(32)
    const userId = getRandomBytes(16)

    const createOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge as unknown as BufferSource,
      rp: {
        name: 'CRM شخصی',
        id: window.location.hostname || 'localhost',
      },
      user: {
        id: userId as unknown as BufferSource,
        name: 'user@personal-crm',
        displayName: 'کاربر CRM شخصی',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
    }

    const credential = (await navigator.credentials.create({
      publicKey: createOptions,
    })) as PublicKeyCredential

    if (!credential) {
      throw new Error('احراز هویت بیومتریک لغو شد.')
    }

    return {
      credentialId: bufferToHex(credential.rawId),
    }
  }

  async verifyBiometric(credentialIdHex?: string): Promise<boolean> {
    if (!window.PublicKeyCredential) return false

    try {
      const challenge = getRandomBytes(32)
      const getOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge as unknown as BufferSource,
        userVerification: 'required',
        timeout: 60000,
      }

      if (credentialIdHex) {
        const bytes = new Uint8Array(credentialIdHex.length / 2)
        for (let i = 0; i < credentialIdHex.length; i += 2) {
          bytes[i / 2] = parseInt(credentialIdHex.substring(i, i + 2), 16)
        }
        getOptions.allowCredentials = [
          {
            id: bytes as unknown as BufferSource,
            type: 'public-key',
            transports: ['internal'],
          },
        ]
      }

      const assertion = await navigator.credentials.get({
        publicKey: getOptions,
      })

      return !!assertion
    } catch (err) {
      console.warn('Biometric verification failed or cancelled:', err)
      return false
    }
  }
}

export const biometricService = new BiometricService()

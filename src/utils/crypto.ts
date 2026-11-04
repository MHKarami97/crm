/**
 * Cryptographic utilities using browser-native Web Crypto API.
 * Strict local-first security - zero network leakage.
 */

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToBuffer(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length')
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export async function hashSha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  return bufferToHex(buffer)
}

export async function hashPasscode(
  passcode: string,
  saltHex?: string,
  iterations = 100000
): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? hexToBuffer(saltHex) : getRandomBytes(16)
  const encoder = new TextEncoder()
  const passcodeBytes = encoder.encode(passcode)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passcodeBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )

  return {
    hash: bufferToHex(derived),
    salt: bufferToHex(salt),
  }
}

export async function verifyPasscode(
  passcode: string,
  expectedHash: string,
  saltHex: string,
  iterations = 100000
): Promise<boolean> {
  try {
    const result = await hashPasscode(passcode, saltHex, iterations)
    return result.hash === expectedHash
  } catch {
    return false
  }
}

export async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptAesGcm(
  plainText: string,
  password: string,
  iterations = 100000
): Promise<{
  ciphertext: string
  salt: string
  iv: string
  iterations: number
}> {
  const salt = getRandomBytes(16)
  const iv = getRandomBytes(12)
  const key = await deriveAesKey(password, salt, iterations)

  const encoder = new TextEncoder()
  const encodedData = encoder.encode(plainText)

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encodedData as unknown as BufferSource
  )

  return {
    ciphertext: bufferToHex(cipherBuffer),
    salt: bufferToHex(salt),
    iv: bufferToHex(iv),
    iterations,
  }
}

export async function decryptAesGcm(
  ciphertextHex: string,
  password: string,
  saltHex: string,
  ivHex: string,
  iterations = 100000
): Promise<string> {
  const salt = hexToBuffer(saltHex)
  const iv = hexToBuffer(ivHex)
  const ciphertext = hexToBuffer(ciphertextHex)

  const key = await deriveAesKey(password, salt, iterations)

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    ciphertext as unknown as BufferSource
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}

export function generateRecoveryKey(): string {
  const bytes = getRandomBytes(16)
  const hex = bufferToHex(bytes)
  // Format as 4 groups of 8 characters for readability: XXXX-XXXX-XXXX-XXXX
  return (
    hex.substring(0, 8) +
    '-' +
    hex.substring(8, 16) +
    '-' +
    hex.substring(16, 24) +
    '-' +
    hex.substring(24, 32)
  ).toUpperCase()
}

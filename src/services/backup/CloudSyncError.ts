export type CloudSyncErrorKind =
  | 'AUTH'
  | 'NETWORK'
  | 'API'
  | 'QUOTA'
  | 'INVALID_BACKUP'
  | 'PASSPHRASE_REQUIRED'
  | 'PASSPHRASE_INVALID'
  | 'KEY_MISSING'

export class CloudSyncError extends Error {
  constructor(
    public readonly kind: CloudSyncErrorKind,
    message: string
  ) {
    super(message)
    this.name = 'CloudSyncError'
  }
}

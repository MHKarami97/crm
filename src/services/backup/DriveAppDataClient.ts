import { CloudSyncError } from './CloudSyncError'
import { googleAuthService, type GoogleAuthService } from './GoogleAuthService'

export interface RemoteBackupInfo {
  id: string
  name: string
  modifiedTime: string
  size?: string
  appProperties?: Record<string, string>
}

const API = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const FILE_FIELDS = 'id,name,modifiedTime,size,appProperties'

export class DriveAppDataClient {
  constructor(
    private readonly auth: GoogleAuthService = googleAuthService,
    private readonly namePrefix: string = 'personal-crm.backup.'
  ) {}

  async list(): Promise<RemoteBackupInfo[]> {
    const query = encodeURIComponent(`name contains '${this.namePrefix}' and trashed = false`)
    const url =
      `${API}?spaces=appDataFolder&q=${query}&orderBy=modifiedTime desc&pageSize=30` +
      `&fields=files(${FILE_FIELDS})`
    const response = await this.request(url)
    const body = await response.json()
    return (body.files ?? []) as RemoteBackupInfo[]
  }

  async read(fileId: string): Promise<string> {
    const response = await this.request(`${API}/${fileId}?alt=media`)
    return response.text()
  }

  async create(
    name: string,
    content: string,
    appProperties: Record<string, string>
  ): Promise<RemoteBackupInfo> {
    const metadata = {
      name,
      parents: ['appDataFolder'],
      mimeType: 'application/json',
      appProperties,
    }
    const boundary = 'crm_backup_' + Math.random().toString(36).slice(2)
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n`,
      content,
      `\r\n--${boundary}--`,
    ])

    const response = await this.request(`${UPLOAD}?uploadType=multipart&fields=${FILE_FIELDS}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    })
    return response.json()
  }

  async remove(fileId: string): Promise<void> {
    await this.request(`${API}/${fileId}`, { method: 'DELETE' })
  }

  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${this.auth.getToken()}`)
    const response = await fetch(url, { ...init, headers })
    if (!response.ok) {
      if (response.status === 401) {
        this.auth.clear()
        throw new CloudSyncError('AUTH', 'نشست Google منقضی شده است؛ لطفاً دوباره متصل شوید.')
      }
      throw new CloudSyncError('API', `خطای ارتباط با سرور گوگل: ${response.statusText}`)
    }
    return response
  }
}

export const driveAppDataClient = new DriveAppDataClient()

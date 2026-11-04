import type { Person } from '@/domain/models'

export class VCardService {
  /**
   * Export list of people to vCard 3.0 format
   */
  exportToVCard(people: Person[]): string {
    const cards: string[] = []

    for (const p of people) {
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN;CHARSET=UTF-8:${p.name}`,
        `N;CHARSET=UTF-8:${p.name};;;;`,
      ]

      for (const phone of p.phones) {
        if (phone) lines.push(`TEL;TYPE=CELL:${phone}`)
      }

      for (const email of p.emails) {
        if (email) lines.push(`EMAIL;TYPE=INTERNET:${email}`)
      }

      if (p.notes) {
        const escapedNote = p.notes.replace(/\n/g, '\\n')
        lines.push(`NOTE;CHARSET=UTF-8:${escapedNote}`)
      }

      if (p.tags && p.tags.length > 0) {
        lines.push(`CATEGORIES;CHARSET=UTF-8:${p.tags.join(',')}`)
      }

      if (p.customFields) {
        if (p.customFields.organization) {
          lines.push(`ORG;CHARSET=UTF-8:${p.customFields.organization}`)
        }
        if (p.customFields.jobTitle) {
          lines.push(`TITLE;CHARSET=UTF-8:${p.customFields.jobTitle}`)
        }
        if (p.customFields.birthdate) {
          lines.push(`BDAY:${p.customFields.birthdate}`)
        }
      }

      lines.push('END:VCARD')
      cards.push(lines.join('\r\n'))
    }

    return cards.join('\r\n')
  }

  /**
   * Parse vCard string into Person objects
   */
  parseVCard(vCardText: string): Partial<Person>[] {
    const rawCards = vCardText.split(/BEGIN:VCARD/i).filter((c) => c.trim().length > 0)
    const results: Partial<Person>[] = []

    for (const raw of rawCards) {
      const lines = raw.split(/\r\n|\r|\n/)
      let name = ''
      const phones: string[] = []
      const emails: string[] = []
      let notes = ''
      const tags: string[] = []
      const customFields: Record<string, any> = {}

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        if (trimmed.startsWith('FN:') || trimmed.startsWith('FN;')) {
          const parts = trimmed.split(':')
          name = parts.slice(1).join(':').trim()
        } else if (!name && (trimmed.startsWith('N:') || trimmed.startsWith('N;'))) {
          const parts = trimmed.split(':')
          name = parts.slice(1).join(':').replace(/;/g, ' ').trim()
        } else if (trimmed.startsWith('TEL')) {
          const parts = trimmed.split(':')
          const phone = parts.slice(1).join(':').trim()
          if (phone && !phones.includes(phone)) phones.push(phone)
        } else if (trimmed.startsWith('EMAIL')) {
          const parts = trimmed.split(':')
          const email = parts.slice(1).join(':').trim()
          if (email && !emails.includes(email)) emails.push(email)
        } else if (trimmed.startsWith('NOTE')) {
          const parts = trimmed.split(':')
          notes = parts.slice(1).join(':').replace(/\\n/g, '\n').trim()
        } else if (trimmed.startsWith('CATEGORIES')) {
          const parts = trimmed.split(':')
          const rawCats = parts.slice(1).join(':').split(',')
          for (const c of rawCats) {
            const cat = c.trim()
            if (cat && !tags.includes(cat)) tags.push(cat)
          }
        } else if (trimmed.startsWith('ORG')) {
          const parts = trimmed.split(':')
          customFields.organization = parts.slice(1).join(':').trim()
        } else if (trimmed.startsWith('TITLE')) {
          const parts = trimmed.split(':')
          customFields.jobTitle = parts.slice(1).join(':').trim()
        }
      }

      if (name || phones.length > 0) {
        results.push({
          name: name || phones[0] || 'مخاطب بدون نام',
          phones,
          emails,
          notes,
          tags,
          customFields,
        })
      }
    }

    return results
  }
}

export const vCardService = new VCardService()

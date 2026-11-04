import type { Person } from '@/domain/models'

export class CsvService {
  /**
   * Export list of people to CSV with UTF-8 BOM for Persian Excel support
   */
  exportToCsv(people: Person[]): Blob {
    const BOM = '\uFEFF'
    const headers = ['نام', 'شماره‌های تماس', 'ایمیل‌ها', 'برچسب‌ها', 'یادداشت', 'سازمان', 'سمت']
    const rows = [headers.join(',')]

    for (const p of people) {
      const escape = (str: string | undefined | null) => {
        if (!str) return '""'
        const escaped = str.replace(/"/g, '""')
        return `"${escaped}"`
      }

      const row = [
        escape(p.name),
        escape(p.phones.join('; ')),
        escape(p.emails.join('; ')),
        escape(p.tags.join('; ')),
        escape(p.notes),
        escape(p.customFields?.organization),
        escape(p.customFields?.jobTitle),
      ]
      rows.push(row.join(','))
    }

    const csvContent = BOM + rows.join('\r\n')
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  }

  /**
   * Parse CSV string into Person objects
   */
  parseCsv(csvText: string): Partial<Person>[] {
    const lines = csvText.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) return []

    const results: Partial<Person>[] = []

    // Helper to split CSV line respecting quotes
    const parseLine = (line: string): string[] => {
      const values: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      return values
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i])
      const name = cols[0] || ''
      const phoneRaw = cols[1] || ''
      const emailRaw = cols[2] || ''
      const tagsRaw = cols[3] || ''
      const notes = cols[4] || ''
      const org = cols[5] || ''
      const job = cols[6] || ''

      const phones = phoneRaw
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
      const emails = emailRaw
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
      const tags = tagsRaw
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)

      if (name || phones.length > 0) {
        results.push({
          name: name || phones[0] || 'مخاطب بدون نام',
          phones,
          emails,
          tags,
          notes,
          customFields: {
            organization: org,
            jobTitle: job,
          },
        })
      }
    }

    return results
  }
}

export const csvService = new CsvService()

import type { Person } from '@/domain/models'

export interface DuplicateMatch {
  incoming: Partial<Person>
  existing: Person
  reason: 'phone' | 'email' | 'name'
  matchedValue: string
}

export class DuplicateDetector {
  findDuplicates(incomingList: Partial<Person>[], existingList: Person[]): DuplicateMatch[] {
    const matches: DuplicateMatch[] = []

    const phoneIndex = new Map<string, Person>()
    const emailIndex = new Map<string, Person>()
    const nameIndex = new Map<string, Person>()

    for (const p of existingList) {
      if (p.name) {
        nameIndex.set(this.normalizeName(p.name), p)
      }
      for (const ph of p.phones) {
        const cleaned = this.cleanPhone(ph)
        if (cleaned) phoneIndex.set(cleaned, p)
      }
      for (const em of p.emails) {
        const cleaned = em.trim().toLowerCase()
        if (cleaned) emailIndex.set(cleaned, p)
      }
    }

    for (const inc of incomingList) {
      let matched = false

      // 1. Check phone match
      if (inc.phones) {
        for (const ph of inc.phones) {
          const cleaned = this.cleanPhone(ph)
          if (cleaned && phoneIndex.has(cleaned)) {
            matches.push({
              incoming: inc,
              existing: phoneIndex.get(cleaned)!,
              reason: 'phone',
              matchedValue: ph,
            })
            matched = true
            break
          }
        }
      }

      if (matched) continue

      // 2. Check email match
      if (inc.emails) {
        for (const em of inc.emails) {
          const cleaned = em.trim().toLowerCase()
          if (cleaned && emailIndex.has(cleaned)) {
            matches.push({
              incoming: inc,
              existing: emailIndex.get(cleaned)!,
              reason: 'email',
              matchedValue: em,
            })
            matched = true
            break
          }
        }
      }

      if (matched) continue

      // 3. Check exact name match
      if (inc.name) {
        const norm = this.normalizeName(inc.name)
        if (norm && nameIndex.has(norm)) {
          matches.push({
            incoming: inc,
            existing: nameIndex.get(norm)!,
            reason: 'name',
            matchedValue: inc.name,
          })
        }
      }
    }

    return matches
  }

  private cleanPhone(phone: string): string {
    const digits = phone.replace(/[^\d]/g, '')
    // Match last 10 digits to handle country code prefix (e.g. 0912 vs +98912)
    return digits.length > 10 ? digits.slice(-10) : digits
  }

  private normalizeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[ي]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/\s+/g, ' ')
  }
}

export const duplicateDetector = new DuplicateDetector()

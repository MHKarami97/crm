import type { Person } from '@/domain/models'
import { daysUntilBirthday, gregorianToShamsi } from '@/utils/jalali'
import { toPersianDigits } from '@/utils/format'

export interface UpcomingCelebration {
  person: Person
  type: 'birthday' | 'anniversary'
  dateStr: string
  daysLeft: number
  description: string
}

export class CelebrationService {
  findUpcoming(people: Person[], withinDays = 30): UpcomingCelebration[] {
    const list: UpcomingCelebration[] = []

    for (const p of people) {
      if (p.archived) continue

      // 1. Check custom field birthdate
      const birthdate = p.customFields?.birthdate
      if (birthdate) {
        const days = daysUntilBirthday(String(birthdate))
        if (days !== null && days >= 0 && days <= withinDays) {
          let desc = ''
          if (days === 0) {
            desc = 'امروز تولد است!'
          } else if (days === 1) {
            desc = 'فردا'
          } else {
            desc = `${toPersianDigits(days)} روز دیگر`
          }

          list.push({
            person: p,
            type: 'birthday',
            dateStr: String(birthdate),
            daysLeft: days,
            description: desc,
          })
        }
      }
    }

    return list.sort((a, b) => a.daysLeft - b.daysLeft)
  }
}

export const celebrationService = new CelebrationService()

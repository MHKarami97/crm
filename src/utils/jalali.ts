import jalaali from 'jalaali-js'
import { toPersianDigits } from './format'

export { toPersianDigits }

export interface ShamsiDateObject {
  jy: number
  jm: number
  jd: number
}

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

export function gregorianToShamsi(date: Date | string | number): ShamsiDateObject {
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    const today = new Date()
    return jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate())
  }
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function shamsiToGregorian(jy: number, jm: number, jd: number): Date {
  const g = jalaali.toGregorian(jy, jm, jd)
  return new Date(g.gy, g.gm - 1, g.gd)
}

export function formatShamsiDate(date: Date | string | number): string {
  const s = gregorianToShamsi(date)
  const monthName = PERSIAN_MONTHS[s.jm - 1] || ''
  return toPersianDigits(`${s.jd} ${monthName} ${s.jy}`)
}

export function formatShortShamsi(date: Date | string | number): string {
  const s = gregorianToShamsi(date)
  const m = String(s.jm).padStart(2, '0')
  const d = String(s.jd).padStart(2, '0')
  return toPersianDigits(`${s.jy}/${m}/${d}`)
}

export function getTodayShamsiString(): string {
  const today = new Date()
  const s = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const m = String(s.jm).padStart(2, '0')
  const d = String(s.jd).padStart(2, '0')
  return `${s.jy}-${m}-${d}`
}

/**
 * Checks if a given Shamsi birthdate has its anniversary within the next N days
 */
export function daysUntilBirthday(birthdateStr: string): number | null {
  if (!birthdateStr) return null

  // Accepts either YYYY-MM-DD or YYYY/MM/DD
  const parts = birthdateStr.split(/[-/]/).map(Number)
  if (parts.length < 3 || isNaN(parts[1]) || isNaN(parts[2])) return null

  const birthMonth = parts[1]
  const birthDay = parts[2]

  const today = new Date()
  const currentShamsi = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate())

  // Calculate day difference within current Shamsi year or next year
  let targetYear = currentShamsi.jy
  if (
    currentShamsi.jm > birthMonth ||
    (currentShamsi.jm === birthMonth && currentShamsi.jd > birthDay)
  ) {
    targetYear += 1
  }

  try {
    const targetG = jalaali.toGregorian(targetYear, birthMonth, birthDay)
    const targetDate = new Date(targetG.gy, targetG.gm - 1, targetG.gd)
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diffTime = targetDate.getTime() - todayZero.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

/**
 * Calculates days elapsed between a Shamsi date (YYYY-MM-DD or YYYY/MM/DD) and today.
 * Positive = past (e.g. 10 days ago)
 * Negative = future (e.g. 5 days remaining)
 * 0 = today
 */
export function daysSinceShamsiDate(shamsiDateStr: string): number | null {
  if (!shamsiDateStr) return null
  const parts = shamsiDateStr.split(/[-/]/).map(Number)
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return null

  try {
    const g = jalaali.toGregorian(parts[0], parts[1], parts[2])
    const target = new Date(g.gy, g.gm - 1, g.gd)
    const today = new Date()
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diffTime = todayZero.getTime() - target.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}


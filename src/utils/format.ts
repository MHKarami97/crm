/**
 * Number formatting and Persian string utilities
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return ''
  const str = String(input)
  return str.replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] || digit)
}

export function formatPrice(amount: number): string {
  if (isNaN(amount)) return '۰ تومان'
  const formatted = new Intl.NumberFormat('fa-IR').format(amount)
  return `${formatted} تومان`
}

export function formatMaskedPrice(amount: number, isMasked: boolean): string {
  if (isMasked) {
    return '***,*** تومان'
  }
  return formatPrice(amount)
}

export function formatCount(count: number, unit = 'مورد'): string {
  return `${toPersianDigits(count)} ${unit}`
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  return toPersianDigits(cleaned)
}

export function truncate(text: string, length = 40): string {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

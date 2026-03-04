export const MIN_INSURABLE_VALUE = 3300
export const MAX_UNITS = 1000

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DIGITS_WITH_OPTIONAL_DECIMALS_REGEX = /^\d+(\.\d+)?$/
const POSITIVE_INTEGER_REGEX = /^\d+$/

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(value))
}

export function parseFormattedNumber(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim()
  if (!normalized || !DIGITS_WITH_OPTIONAL_DECIMALS_REGEX.test(normalized)) {
    return null
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

export function parsePositiveInteger(value: string): number | null {
  const normalized = value.trim()
  if (!POSITIVE_INTEGER_REGEX.test(normalized)) {
    return null
  }

  const parsed = Number.parseInt(normalized, 10)
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return null
  }

  return parsed
}

export function formatNumberWithCommas(value: string, locale = "en-AU"): string {
  const cleanedValue = value.replace(/[^\d.]/g, "")
  if (!cleanedValue) {
    return ""
  }

  const firstDotIndex = cleanedValue.indexOf(".")
  const normalized =
    firstDotIndex === -1
      ? cleanedValue
      : `${cleanedValue.slice(0, firstDotIndex)}.${cleanedValue
          .slice(firstDotIndex + 1)
          .replace(/\./g, "")}`

  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed)) {
    return ""
  }

  return parsed.toLocaleString(locale, { maximumFractionDigits: 2 })
}

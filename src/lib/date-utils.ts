/**
 * Date utilities for handling dates consistently across timezones
 */

/**
 * Parse a date string as a local date without timezone conversion
 * This prevents timezone shifting for date-only values
 */
export function parseLocalDate(dateString: string | Date): Date {
  if (!dateString) return new Date()

  // If it's already a Date object, return as-is
  if (dateString instanceof Date) return dateString

  // If it's a date-only string (YYYY-MM-DD), parse as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }

  // For full ISO strings, parse normally
  return new Date(dateString)
}

/**
 * Format a date as a local date string (YYYY-MM-DD) without timezone conversion
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if a date string is date-only format (YYYY-MM-DD)
 */
export function isDateOnlyString(dateString: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString)
}

/**
 * Display a date in the user's preferred locale
 */
export function displayDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof dateString === 'string' ? parseLocalDate(dateString) : dateString

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  })
}
import { type Currency } from "@/lib/pricing"

/**
 * Timezone to currency mapping - fully client-side detection
 */
const TIMEZONE_TO_CURRENCY: Record<string, Currency> = {
  // Australia
  'Australia/Adelaide': 'AUD',
  'Australia/Brisbane': 'AUD',
  'Australia/Darwin': 'AUD',
  'Australia/Eucla': 'AUD',
  'Australia/Hobart': 'AUD',
  'Australia/Lindeman': 'AUD',
  'Australia/Lord_Howe': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Australia/Perth': 'AUD',
  'Australia/Sydney': 'AUD',

  // United States
  'America/New_York': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Phoenix': 'USD',
  'America/Anchorage': 'USD',
  'America/Adak': 'USD',
  'Pacific/Honolulu': 'USD',
  'America/Detroit': 'USD',
  'America/Kentucky/Louisville': 'USD',
  'America/Kentucky/Monticello': 'USD',
  'America/Indiana/Indianapolis': 'USD',
  'America/Indiana/Vincennes': 'USD',
  'America/Indiana/Winamac': 'USD',
  'America/Indiana/Marengo': 'USD',
  'America/Indiana/Petersburg': 'USD',
  'America/Indiana/Vevay': 'USD',

  // United Kingdom
  'Europe/London': 'GBP',
  'Europe/Belfast': 'GBP',

  // Canada
  'America/Toronto': 'CAD',
  'America/Vancouver': 'CAD',
  'America/Edmonton': 'CAD',
  'America/Winnipeg': 'CAD',
  'America/Halifax': 'CAD',
  'America/St_Johns': 'CAD',
  'America/Regina': 'CAD',

  // New Zealand
  'Pacific/Auckland': 'NZD',
  'Pacific/Chatham': 'NZD',

  // Europe (EUR)
  'Europe/Berlin': 'EUR',
  'Europe/Paris': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Vienna': 'EUR',
  'Europe/Lisbon': 'EUR',
  'Europe/Dublin': 'EUR',
  'Europe/Helsinki': 'EUR',
  'Europe/Athens': 'EUR',
  'Europe/Luxembourg': 'EUR',
  'Europe/Malta': 'EUR',
  'Europe/Nicosia': 'EUR',
  'Europe/Bratislava': 'EUR',
  'Europe/Ljubljana': 'EUR',
  'Europe/Tallinn': 'EUR',
  'Europe/Riga': 'EUR',
  'Europe/Vilnius': 'EUR',
}

/**
 * Timezone-based currency detection (fully client-side)
 * This is more reliable than browser locale settings
 */
export const detectUserCurrency = (): Currency => {
  if (typeof window === 'undefined') {
    return 'USD' // SSR fallback
  }

  try {
    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Direct timezone mapping
    if (TIMEZONE_TO_CURRENCY[timezone]) {
      return TIMEZONE_TO_CURRENCY[timezone]
    }

    // Fallback: parse timezone patterns
    if (timezone.startsWith('Australia/')) return 'AUD'
    if (timezone.startsWith('America/') && !timezone.includes('Canada')) {
      // Most American timezones are USD, except Canada
      if (timezone.includes('Toronto') || timezone.includes('Vancouver') ||
          timezone.includes('Edmonton') || timezone.includes('Winnipeg') ||
          timezone.includes('Halifax') || timezone.includes('Regina')) {
        return 'CAD'
      }
      return 'USD'
    }
    if (timezone.startsWith('Europe/')) {
      // UK uses GBP, most others use EUR
      if (timezone.includes('London') || timezone.includes('Belfast')) {
        return 'GBP'
      }
      return 'EUR'
    }
    if (timezone.startsWith('Pacific/')) {
      if (timezone.includes('Auckland') || timezone.includes('Chatham')) {
        return 'NZD'
      }
      return 'USD' // Pacific islands mostly use USD
    }

    // Final fallback: try browser locale currency
    const userCurrency = new Intl.NumberFormat().resolvedOptions().currency?.toUpperCase() as Currency
    const supportedCurrencies: Currency[] = ["AUD", "USD", "GBP", "EUR", "CAD", "NZD"]

    if (userCurrency && supportedCurrencies.includes(userCurrency)) {
      return userCurrency
    }

    return 'USD'
  } catch {
    return 'USD'
  }
}
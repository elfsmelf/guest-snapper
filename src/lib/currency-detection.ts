import { type Currency } from "@/lib/pricing"

/**
 * Currency detection - always returns USD
 * No dynamic adjustment based on timezone or locale
 */
export const detectUserCurrency = (): Currency => {
  return 'USD'
}
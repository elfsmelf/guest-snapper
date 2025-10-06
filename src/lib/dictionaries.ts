import 'server-only'

// Main app dictionaries
const dictionaries = {
  en: () => import('@/app/dictionaries/en.json').then((module) => module.default),
  ko: () => import('@/app/dictionaries/ko.json').then((module) => module.default),
}

// Auth UI dictionaries
const authDictionaries = {
  en: () => import('@/app/dictionaries/auth-en.json').then((module) => module.default),
  ko: () => import('@/app/dictionaries/auth-ko.json').then((module) => module.default),
}

export type Locale = 'en' | 'ko'

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]()
}

export const getAuthDictionary = (locale: Locale) => {
  return authDictionaries[locale]()
}

// Type helper to get dictionary structure
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
export type AuthDictionary = Awaited<ReturnType<typeof getAuthDictionary>>

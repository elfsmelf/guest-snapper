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
  // Ensure locale is valid, default to 'en' if not
  const validLocale = (locale === 'en' || locale === 'ko') ? locale : 'en'
  const dictionaryLoader = dictionaries[validLocale]

  if (typeof dictionaryLoader !== 'function') {
    console.error(`Dictionary loader for locale "${validLocale}" is not a function:`, dictionaryLoader)
    // Fallback to English if the loader is invalid
    return dictionaries.en()
  }

  return dictionaryLoader()
}

export const getAuthDictionary = (locale: Locale) => {
  // Ensure locale is valid, default to 'en' if not
  const validLocale = (locale === 'en' || locale === 'ko') ? locale : 'en'
  const dictionaryLoader = authDictionaries[validLocale]

  if (typeof dictionaryLoader !== 'function') {
    console.error(`Auth dictionary loader for locale "${validLocale}" is not a function:`, dictionaryLoader)
    // Fallback to English if the loader is invalid
    return authDictionaries.en()
  }

  return dictionaryLoader()
}

// Type helper to get dictionary structure
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
export type AuthDictionary = Awaited<ReturnType<typeof getAuthDictionary>>

import { 
  parseAsInteger,
  parseAsStringLiteral
} from 'nuqs'

// Simple navigation state for onboarding - only what belongs in URLs
export const onboardingNavParams = {
  step: parseAsInteger.withDefault(1),
  view: parseAsStringLiteral(['wizard', 'overview', 'progress']).withDefault('wizard')
} as const

export type OnboardingNavParams = {
  [K in keyof typeof onboardingNavParams]: ReturnType<typeof onboardingNavParams[K]['parseServerSide']>
}
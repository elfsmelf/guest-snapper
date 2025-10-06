"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// Base query options for all onboarding queries
const onboardingQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh during wizard
  gcTime: 30 * 60 * 1000, // 30 minutes - cache persists for entire session
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create a stable QueryClient that persists across step navigation
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: onboardingQueryOptions,
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-primary/5 border-primary/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-xl font-bold">Quick Setup</div>
                <div className="text-sm text-muted-foreground">
                  Let's get your gallery ready!
                </div>
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    </QueryClientProvider>
  )
}
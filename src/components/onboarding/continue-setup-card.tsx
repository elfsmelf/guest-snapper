"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Rocket,
  ChevronRight,
  X,
  Sparkles,
  CheckCircle,
  Circle,
  Settings
} from "lucide-react"
import { type OnboardingState } from "@/types/onboarding"
import { skipOnboarding } from "@/app/actions/onboarding"
import { toast } from "sonner"

interface ContinueSetupCardProps {
  eventId: string
  eventSlug: string
  eventName: string
  onboardingState: OnboardingState | null
  onClose?: () => void
}

const SETUP_STEPS = [
  { id: 'test-images', name: 'Upload test images', required: true },
  { id: 'cover-photo', name: 'Add cover photo', required: false },
  { id: 'privacy', name: 'Configure privacy', required: true },
  { id: 'guest-count', name: 'Set guest count', required: true },
  { id: 'publish', name: 'Publish gallery', required: true },
  { id: 'albums', name: 'Create albums', required: false },
  { id: 'qr-code', name: 'Download QR code', required: true },
  { id: 'slideshow', name: 'Test slideshow', required: false },
  { id: 'collaborators', name: 'Add team', required: false },
  { id: 'theme', name: 'Choose theme', required: false }
]

export function ContinueSetupCard({
  eventId,
  eventSlug,
  eventName,
  onboardingState,
  onClose
}: ContinueSetupCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isDismissing, setIsDismissing] = useState(false)

  const currentStep = onboardingState?.currentStep || 3 // Default to step 3 since we're after step 2

  // Extract language from pathname (e.g., /en/gallery/... -> en)
  const lang = pathname?.split('/')[1] || 'en'

  const handleGoToSettings = () => {
    // Redirect to event dashboard and scroll to pricing section
    router.push(`/${lang}/dashboard/events/${eventId}#choose-plan`)
  }
  
  const handleDismiss = async () => {
    setIsDismissing(true)
    try {
      const result = await skipOnboarding(eventId)
      if (result.success) {
        toast.success("Setup wizard dismissed. You can complete setup anytime from your dashboard.")
        if (onClose) onClose()
      }
    } catch (error) {
      toast.error("Failed to dismiss setup wizard")
    } finally {
      setIsDismissing(false)
    }
  }
  
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">Activate Your Gallery</h3>
              <p className="text-sm text-muted-foreground">
                You're on a 7-day free trial to explore all features. Your gallery is not publicly visible until you choose a plan and activate it.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:shrink-0">
            <Button
              onClick={handleGoToSettings}
              className="gap-2 flex-1 md:flex-none"
            >
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Activate Gallery</span>
              <span className="sm:hidden">Activate</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              disabled={isDismissing}
              className="h-9 w-9 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  Circle
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
  const [isDismissing, setIsDismissing] = useState(false)
  
  const currentStep = onboardingState?.currentStep || 3 // Default to step 3 since we're after step 2
  
  const handleContinueSetup = () => {
    // Redirect back to onboarding at the current step
    router.push(`/onboarding?slug=${eventSlug}&step=${currentStep}`)
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Continue Setting Up Your Gallery</h3>
              <p className="text-sm text-muted-foreground">
                Complete your gallery setup to unlock all features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleContinueSetup}
              className="gap-2"
            >
              Continue Setup
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              disabled={isDismissing}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
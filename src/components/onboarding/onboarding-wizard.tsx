"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQueryStates } from 'nuqs'
import { onboardingNavParams } from '@/lib/onboarding-params'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Camera,
  Shield,
  Palette,
  Users,
  Globe,
  FolderPlus,
  QrCode,
  Play,
  UserPlus,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Rocket,
  Eye,
  Settings
} from "lucide-react"
import { toast } from "sonner"
import posthog from 'posthog-js'
// import { motion, AnimatePresence } from "framer-motion" // Commenting out for now
import {
  ONBOARDING_STEPS,
  type OnboardingState
} from "@/types/onboarding"
import {
  useOnboardingState,
  useUpdateOnboardingStep,
  useCompleteOnboardingStep,
  useSkipOnboardingStep,
  useCompleteOnboarding,
  useUpdateOnboardingProgress,
  usePrefetchNextStep,
  usePrefetchOnboardingData
} from '@/hooks/use-onboarding'
import { SkipConfirmationModal } from "./skip-confirmation-modal"

// Import step components
import { TestImagesStep } from "./steps/test-images-step"
import { PrivacyStep } from "./steps/privacy-step"
import { ThemeStep } from "./steps/theme-step"

interface OnboardingWizardProps {
  eventId: string
  eventSlug: string
  eventName: string
  startAtStep?: number
}

const STEPS = [
  { id: ONBOARDING_STEPS.TEST_IMAGES, title: "Upload Test Images", icon: Upload, required: true },
  { id: ONBOARDING_STEPS.PRIVACY, title: "Configure Privacy", icon: Shield, required: false },
  { id: ONBOARDING_STEPS.THEME, title: "Choose Theme", icon: Palette, required: false },
  { id: 'view-gallery', title: "View Your Gallery", icon: Eye, required: false }
]

export function OnboardingWizard({
  eventId,
  eventSlug,
  eventName,
  startAtStep = 1
}: OnboardingWizardProps) {
  console.log('🧙‍♂️ OnboardingWizard RENDER:', { eventId, eventSlug, eventName, startAtStep })
  
  const router = useRouter()
  const [showSkipModal, setShowSkipModal] = useState(false)
  
  // TanStack Query hooks for data management
  const { data: onboardingData, isLoading, error } = useOnboardingState(eventId)
  
  console.log('🧙‍♂️ OnboardingWizard STATE:', {
    onboardingData,
    isLoading,
    error: error?.message,
    hasData: !!onboardingData
  })
  const updateStep = useUpdateOnboardingStep(eventId)
  const completeStep = useCompleteOnboardingStep(eventId)
  const skipStep = useSkipOnboardingStep(eventId)
  const completeOnboarding = useCompleteOnboarding(eventId)
  const updateProgress = useUpdateOnboardingProgress(eventId)
  const { prefetchEventData, prefetchAlbumsData } = usePrefetchOnboardingData(eventId)
  
  // Check if any mutations are pending for loading states
  const isUpdating = updateStep.isPending || completeStep.isPending || skipStep.isPending || updateProgress.isPending
  const isCompleting = completeOnboarding.isPending
  
  // Simple URL params for navigation only
  const [navParams, setNavParams] = useQueryStates(onboardingNavParams)
  
  // Loading state with better skeleton
  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-2">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
              <div>
                <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="h-2 bg-primary/20 rounded-full w-1/3 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-32 bg-muted rounded animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
        </CardFooter>
      </Card>
    )
  }

  // Error state
  if (error || !onboardingData) {
    return (
      <div className="text-center min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Failed to Load</CardTitle>
            <CardDescription>
              {error?.message || 'Could not load onboarding data'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Use URL step or database step as fallback
  const currentStep = navParams.step || onboardingData.currentStep || startAtStep

  const totalSteps = STEPS.length
  const progress = (currentStep / totalSteps) * 100
  const currentStepData = STEPS[currentStep - 1]
  const isLastStep = currentStep === totalSteps
  const isFirstStep = currentStep === 1

  const handleNext = async () => {
    if (isLastStep) {
      completeOnboarding.mutate()
      // Track onboarding completion
      posthog.capture('onboarding_completed', {
        event_id: eventId,
        total_steps: totalSteps,
      })
    } else {
      // Track step completion
      if (currentStepData) {
        posthog.capture('onboarding_step_completed', {
          event_id: eventId,
          step_id: currentStepData.id,
          step_number: currentStep,
          step_title: currentStepData.title,
          is_required: currentStepData.required,
        })
      }

      // For optional steps, mark as completed when pressing Next (if not already completed)
      if (currentStepData && !currentStepData.required && !isCurrentStepActionComplete()) {
        try {
          await completeStep.mutateAsync(currentStepData.id)
        } catch (error) {
          console.error('Failed to complete optional step:', error)
        }
      }

      // Normal progression to next step (step 2 now uses Link component)
      const nextStep = Math.min(currentStep + 1, totalSteps)

      // Update URL immediately for instant navigation
      setNavParams({ step: nextStep })

      // Update database in background
      updateStep.mutate(nextStep)
    }
  }

  const handlePrevious = async () => {
    const prevStep = Math.max(currentStep - 1, 1)
    setNavParams({ step: prevStep })
    updateStep.mutate(prevStep)
  }

  const handleSkipStep = async () => {
    if (currentStepData) {
      // Track step skip
      posthog.capture('onboarding_step_skipped', {
        event_id: eventId,
        step_id: currentStepData.id,
        step_number: currentStep,
        step_title: currentStepData.title,
        is_required: currentStepData.required,
      })

      // Skip the current step
      skipStep.mutate(currentStepData.id)

      if (!isLastStep) {
        const nextStep = currentStep + 1
        setNavParams({ step: nextStep })
        updateStep.mutate(nextStep)
      }
    }
  }

  const renderStepContent = () => {
    console.log('🧙‍♂️ renderStepContent called for step:', currentStep)
    
    const props = {
      eventId,
      eventSlug,
      eventName,
      state: onboardingData,
      onUpdate: (updates: Partial<OnboardingState>) => {
        console.log('🧙‍♂️ onUpdate called with:', updates)
        updateProgress.mutate(updates)
      },
      onComplete: async () => {
        console.log('🧙‍♂️ onComplete called for step:', currentStepData?.id)
        const result = await completeStep.mutateAsync(currentStepData.id)
        return result
      }
    }

    console.log('🧙‍♂️ Step props:', props)

    switch (currentStep) {
      case 1: return <TestImagesStep {...props} />
      case 2: return <PrivacyStep {...props} />
      case 3: return <ThemeStep {...props} />
      case 4: return (
        <div className="space-y-6 text-center py-8">
          <div className="space-y-3">
            <Rocket className="h-16 w-16 mx-auto text-primary" />
            <h3 className="text-2xl font-bold">Your Gallery is Ready!</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You've successfully set up your gallery. Click below to view it and see how your guests will experience it.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              asChild
              size="lg"
              className="gap-2"
              onClick={async () => {
                // Mark onboarding as complete when they view gallery
                await completeOnboarding.mutateAsync()
              }}
            >
              <Link href={`/gallery/${eventSlug}`} target="_blank">
                <Eye className="h-5 w-5" />
                View Gallery
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href={`/dashboard/events/${eventId}`}>
                <Settings className="h-5 w-5" />
                Event Settings
              </Link>
            </Button>
          </div>
        </div>
      )
      default: return null
    }
  }

  const isStepComplete = (stepId: string) => {
    // Check if step is in completed array first
    if (Array.isArray(onboardingData?.completedSteps) && (onboardingData.completedSteps as string[]).includes(stepId)) {
      return true
    }

    // Also check individual completion flags
    switch (stepId) {
      case ONBOARDING_STEPS.TEST_IMAGES:
        return onboardingData.testImagesUploaded && onboardingData.testImageCount > 0
      case ONBOARDING_STEPS.PRIVACY:
        return onboardingData.privacyConfigured
      case ONBOARDING_STEPS.THEME:
        return onboardingData.themeSelected
      case 'view-gallery':
        return true // This is always complete once reached
      default:
        return false
    }
  }

  const isStepSkipped = (stepId: string) => {
    return (Array.isArray(onboardingData?.skippedSteps) && (onboardingData.skippedSteps as string[]).includes(stepId)) || false
  }

  // Check if current step's required action is completed
  const isCurrentStepActionComplete = () => {
    if (!currentStepData) return false

    switch (currentStepData.id) {
      case ONBOARDING_STEPS.TEST_IMAGES:
        return (onboardingData.testImagesUploaded && onboardingData.testImageCount > 0) || (Array.isArray(onboardingData?.completedSteps) && (onboardingData.completedSteps as string[]).includes(ONBOARDING_STEPS.TEST_IMAGES))
      case ONBOARDING_STEPS.PRIVACY:
        return true // Privacy settings are optional - users can proceed without changing defaults
      case ONBOARDING_STEPS.THEME:
        return true // Theme is optional - users can proceed with default theme
      case 'view-gallery':
        return true // Always ready to view gallery
      default:
        return false
    }
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto border-2">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg truncate">Setting up {eventName}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Step {currentStep} of {totalSteps}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/gallery/${eventSlug}`)}
              className="self-end sm:self-auto text-xs sm:text-sm"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">View Gallery</span>
              <span className="sm:hidden">View</span>
            </Button>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {STEPS.map((step, index) => {
              const stepNumber = index + 1
              const isComplete = isStepComplete(step.id)
              const isSkipped = isStepSkipped(step.id)
              const isCurrent = stepNumber === currentStep
              const isPast = stepNumber < currentStep

              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-medium transition-colors flex-shrink-0 ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isComplete
                      ? "bg-green-500 text-white"
                      : isSkipped
                      ? "bg-muted text-muted-foreground"
                      : isPast
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                  title={step.title}
                >
                  {isComplete ? (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="min-h-[400px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {currentStepData && (
                <>
                  <currentStepData.icon className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
                  {!currentStepData.required && (
                    <Badge variant="secondary">Optional</Badge>
                  )}
                </>
              )}
            </div>
            
            {renderStepContent()}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || isUpdating || isCompleting}
            className="w-full sm:w-auto order-2 sm:order-1"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2 w-full sm:w-auto">
            {/* Skip button - show for optional steps OR required steps that haven't been completed */}
            {(!currentStepData?.required || !isCurrentStepActionComplete()) && !isLastStep && currentStep !== 4 && (
              <Button
                variant={currentStepData?.required && !isCurrentStepActionComplete() ? "outline" : "ghost"}
                onClick={handleSkipStep}
                disabled={isUpdating || isCompleting}
                className="w-full sm:w-auto"
                size="sm"
              >
                {currentStepData?.required && !isCurrentStepActionComplete() ? (
                  <>Skip for Now</>
                ) : (
                  <>Skip This Step</>
                )}
              </Button>
            )}

            {/* Next button - show when action is complete, OR for optional steps, OR for the last step */}
            {(isCurrentStepActionComplete() || !currentStepData?.required || isLastStep) && (
              <Button
                onClick={handleNext}
                disabled={isUpdating || isCompleting}
                className="w-full sm:w-auto"
                size="sm"
              >
                {isLastStep ? (
                  <>
                    Complete Setup
                    <Check className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}

            {/* Show a hint when action is not complete for required steps only */}
            {!isCurrentStepActionComplete() && !isLastStep && currentStepData?.required && (
              <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground text-center">
                Complete the step to continue
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      <SkipConfirmationModal
        open={showSkipModal}
        onClose={() => setShowSkipModal(false)}
        eventId={eventId}
        eventSlug={eventSlug}
      />
    </>
  )
}
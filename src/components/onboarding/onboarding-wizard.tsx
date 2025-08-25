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
  Rocket
} from "lucide-react"
import { toast } from "sonner"
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

// Import step components (we'll create these next)
import { TestImagesStep } from "./steps/test-images-step"
import { CoverPhotoStep } from "./steps/cover-photo-step"
import { PrivacyStep } from "./steps/privacy-step"
import { ThemeStep } from "./steps/theme-step"
import { GuestCountStep } from "./steps/guest-count-step"
import { PublishStep } from "./steps/publish-step"
import { AlbumsStep } from "./steps/albums-step"
import { QRCodeStep } from "./steps/qr-code-step"
import { SlideshowStep } from "./steps/slideshow-step"
import { CollaboratorsStep } from "./steps/collaborators-step"

interface OnboardingWizardProps {
  eventId: string
  eventSlug: string
  eventName: string
  startAtStep?: number
}

const STEPS = [
  { id: ONBOARDING_STEPS.TEST_IMAGES, title: "Upload Test Images", icon: Upload, required: true },
  { id: ONBOARDING_STEPS.COVER_PHOTO, title: "Add Cover Photo", icon: Camera, required: false },
  { id: ONBOARDING_STEPS.PRIVACY, title: "Configure Privacy", icon: Shield, required: true },
  { id: ONBOARDING_STEPS.GUEST_COUNT, title: "Set Guest Count", icon: Users, required: true },
  { id: ONBOARDING_STEPS.PUBLISH, title: "Publish Gallery", icon: Globe, required: true },
  { id: ONBOARDING_STEPS.ALBUMS, title: "Create Albums", icon: FolderPlus, required: false },
  { id: ONBOARDING_STEPS.QR_CODE, title: "Download QR Code", icon: QrCode, required: false },
  { id: ONBOARDING_STEPS.SLIDESHOW, title: "Test Slideshow", icon: Play, required: false },
  { id: ONBOARDING_STEPS.COLLABORATORS, title: "Add Team", icon: UserPlus, required: false },
  { id: ONBOARDING_STEPS.THEME, title: "Choose Theme", icon: Palette, required: false }
]

export function OnboardingWizard({
  eventId,
  eventSlug,
  eventName,
  startAtStep = 1
}: OnboardingWizardProps) {
  const router = useRouter()
  const [showSkipModal, setShowSkipModal] = useState(false)
  
  // TanStack Query hooks for data management
  const { data: onboardingData, isLoading, error } = useOnboardingState(eventId)
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
    } else {
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
      // Skip the current step
      skipStep.mutate(currentStepData.id)
      
      if (!isLastStep) {
        // After step 2 (cover photo), redirect to gallery view with onboarding continuation
        if (currentStep === 2) {
          router.replace(`/gallery/${eventSlug}?continueOnboarding=true&w=true&ws=3`)
          setTimeout(() => {
            setNavParams({ step: 3 })
            updateStep.mutate(3)
          }, 100)
        } else {
          const nextStep = currentStep + 1
          setNavParams({ step: nextStep })
          updateStep.mutate(nextStep)
        }
      }
    }
  }

  const renderStepContent = () => {
    const props = {
      eventId,
      eventSlug,
      eventName,
      state: onboardingData,
      onUpdate: (updates: Partial<OnboardingState>) => {
        updateProgress.mutate(updates)
      },
      onComplete: async () => {
        const result = await completeStep.mutateAsync(currentStepData.id)
        return result
      }
    }

    switch (currentStep) {
      case 1: return <TestImagesStep {...props} />
      case 2: return <CoverPhotoStep {...props} />
      case 3: return <PrivacyStep {...props} />
      case 4: return <GuestCountStep {...props} />
      case 5: return <PublishStep {...props} />
      case 6: return <AlbumsStep {...props} />
      case 7: return <QRCodeStep {...props} />
      case 8: return <SlideshowStep {...props} />
      case 9: return <CollaboratorsStep {...props} />
      case 10: return <ThemeStep {...props} />
      default: return null
    }
  }

  const isStepComplete = (stepId: string) => {
    // Check if step is in completed array first
    if (onboardingData.completedSteps.includes(stepId)) {
      return true
    }
    
    // Also check individual completion flags
    switch (stepId) {
      case ONBOARDING_STEPS.TEST_IMAGES:
        return onboardingData.testImagesUploaded && onboardingData.testImageCount > 0
      case ONBOARDING_STEPS.COVER_PHOTO:
        return onboardingData.coverPhotoSet
      case ONBOARDING_STEPS.PRIVACY:
        return onboardingData.privacyConfigured
      case ONBOARDING_STEPS.GUEST_COUNT:
        return onboardingData.guestCountSet || onboardingData.paymentCompleted
      case ONBOARDING_STEPS.PUBLISH:
        return onboardingData.eventPublished || onboardingData.completedSteps.includes(ONBOARDING_STEPS.PUBLISH)
      case ONBOARDING_STEPS.ALBUMS:
        return onboardingData.albumsCreated > 0
      case ONBOARDING_STEPS.QR_CODE:
        return onboardingData.qrDownloaded
      case ONBOARDING_STEPS.SLIDESHOW:
        return onboardingData.slideshowTested
      case ONBOARDING_STEPS.COLLABORATORS:
        return onboardingData.collaboratorsInvited > 0
      case ONBOARDING_STEPS.THEME:
        return onboardingData.themeSelected
      default:
        return false
    }
  }

  const isStepSkipped = (stepId: string) => {
    return onboardingData.skippedSteps.includes(stepId)
  }

  // Check if current step's required action is completed
  const isCurrentStepActionComplete = () => {
    if (!currentStepData) return false
    
    switch (currentStepData.id) {
      case ONBOARDING_STEPS.TEST_IMAGES:
        return (onboardingData.testImagesUploaded && onboardingData.testImageCount > 0) || onboardingData.completedSteps.includes(ONBOARDING_STEPS.TEST_IMAGES)
      case ONBOARDING_STEPS.COVER_PHOTO:
        return onboardingData.coverPhotoSet || onboardingData.completedSteps.includes(ONBOARDING_STEPS.COVER_PHOTO)
      case ONBOARDING_STEPS.PRIVACY:
        return onboardingData.privacyConfigured
      case ONBOARDING_STEPS.GUEST_COUNT:
        return onboardingData.guestCountSet || onboardingData.paymentCompleted
      case ONBOARDING_STEPS.PUBLISH:
        return onboardingData.eventPublished || onboardingData.completedSteps.includes(ONBOARDING_STEPS.PUBLISH)
      case ONBOARDING_STEPS.ALBUMS:
        return onboardingData.albumsCreated > 0
      case ONBOARDING_STEPS.QR_CODE:
        return onboardingData.qrDownloaded
      case ONBOARDING_STEPS.SLIDESHOW:
        return onboardingData.slideshowTested
      case ONBOARDING_STEPS.COLLABORATORS:
        return onboardingData.collaboratorsInvited > 0
      case ONBOARDING_STEPS.THEME:
        return onboardingData.themeSelected
      default:
        return false
    }
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto border-2">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Rocket className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Setting up {eventName}</CardTitle>
                <CardDescription>
                  Step {currentStep} of {totalSteps}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/gallery/${eventSlug}`)}
            >
              <X className="h-4 w-4 mr-2" />
              View Gallery
            </Button>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((step, index) => {
              const stepNumber = index + 1
              const isComplete = isStepComplete(step.id)
              const isSkipped = isStepSkipped(step.id)
              const isCurrent = stepNumber === currentStep
              const isPast = stepNumber < currentStep
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
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
                    <Check className="h-4 w-4" />
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

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep || isUpdating || isCompleting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {/* Skip button - show for optional steps OR required steps that haven't been completed */}
            {(!currentStepData?.required || !isCurrentStepActionComplete()) && !isLastStep && (
              <Button
                variant={currentStepData?.required && !isCurrentStepActionComplete() ? "outline" : "ghost"}
                onClick={handleSkipStep}
                disabled={isUpdating || isCompleting}
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
              <>
                {/* Step 2: Navigate to gallery and mark step 2 complete */}
                {currentStep === 2 ? (
                  <Button 
                    disabled={isUpdating || isCompleting}
                    onClick={async (e) => {
                      e.preventDefault()
                      
                      try {
                        // Mark step 2 as complete and advance to step 3
                        // This ensures "Continue Setup" goes to step 3
                        await completeStep.mutateAsync('cover-photo')
                        await updateStep.mutateAsync(3)
                        
                        // Navigate after mutations complete
                        window.location.href = `/gallery/${eventSlug}`
                      } catch (error) {
                        console.error('Failed to update onboarding state:', error)
                        // Navigate anyway
                        window.location.href = `/gallery/${eventSlug}`
                      }
                    }}
                  >
                    View Your Gallery
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={isUpdating || isCompleting}
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
              </>
            )}
            
            {/* Show a hint when action is not complete for required steps only */}
            {!isCurrentStepActionComplete() && !isLastStep && currentStepData?.required && (
              <div className="flex items-center text-sm text-muted-foreground">
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
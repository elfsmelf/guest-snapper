"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronUp, Rocket, CheckCircle2, X, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { ProgressIndicator, StepProgress, CategoryProgress } from "./progress-indicator"
import { StepList } from "./quick-start-step"
import { STEP_DEFINITIONS, type QuickStartStep } from "./step-definitions"
import { 
  checkCoverPhotoStatus,
  checkGuestCountStatus,
  checkPrivacySettingsStatus,
  checkPublicationStatus,
  checkThemeSelectionStatus,
  checkTestPhotosStatus,
  checkQRDownloadStatus,
  checkSlideshowTestStatus,
  checkCollaboratorsStatus,
  checkStepSkippedStatus,
  calculateProgress,
  getCompletionMessage,
  type StepStatus
} from "./step-detection"
import { 
  markQRDownloaded,
  markSlideshowTested,
  markStepCompleted
} from "@/app/actions/quick-start"
import { useOptimistic, useTransition } from "react"

// Event interface matching the schema
interface Event {
  id: string
  slug: string
  coverImageUrl?: string | null
  guestCount: number
  guestCanViewAlbum: boolean
  approveUploads: boolean
  activationDate?: string | null
  isPublished: boolean
  themeId: string
  plan?: string
  organizationId?: string | null
  quickStartProgress?: string
}

interface Organization {
  id: string
  name: string
  members?: Array<{
    id: string
    role: string
  }>
}

interface QuickStartGuideProps {
  event: Event
  organization?: Organization | null
  photoCount?: number
  className?: string
}

export function QuickStartGuide({ event, organization, photoCount = 0, className }: QuickStartGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  
  // Optimistic state for the event
  const [optimisticEvent, setOptimisticEvent] = useOptimistic(
    event,
    (currentEvent, newProgress: string) => ({
      ...currentEvent,
      quickStartProgress: newProgress
    })
  )

  // Load dismissal state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(`quickstart_dismissed_${event.id}`)
    setIsDismissed(dismissed === 'true')
    setIsLoading(false)
  }, [event.id])

  // Calculate test photos status from prop
  const testPhotosStatus = checkTestPhotosStatus(photoCount)

  // Calculate step statuses
  const steps: QuickStartStep[] = useMemo(() => {
    return STEP_DEFINITIONS.map(stepDef => {
      let status: StepStatus = 'incomplete'

      // Check if step has been manually skipped first
      if (!stepDef.isRequired && checkStepSkippedStatus(stepDef.id, optimisticEvent)) {
        status = 'optional-completed'
      } else {
        // Normal status checking
        switch (stepDef.id) {
          case 'cover-photo':
            status = checkCoverPhotoStatus(optimisticEvent)
            break
          case 'guest-count':
            status = checkGuestCountStatus(optimisticEvent)
            break
          case 'privacy-settings':
            status = checkPrivacySettingsStatus(optimisticEvent)
            break
          case 'publish-event':
            status = checkPublicationStatus(optimisticEvent)
            break
          case 'theme-selection':
            status = checkThemeSelectionStatus(optimisticEvent)
            break
          case 'test-photos':
            status = testPhotosStatus
            break
          case 'qr-download':
            status = checkQRDownloadStatus(optimisticEvent)
            break
          case 'slideshow-test':
            status = checkSlideshowTestStatus(optimisticEvent)
            break
          case 'collaborators':
            status = checkCollaboratorsStatus(organization || null)
            break
        }
      }

      return {
        ...stepDef,
        status
      }
    })
  }, [optimisticEvent, organization, testPhotosStatus])

  // Calculate progress metrics
  const progress = useMemo(() => {
    const stepsWithWeights = steps.map(step => ({
      status: step.status,
      isRequired: step.isRequired,
      weight: step.weight
    }))
    
    const overallProgress = calculateProgress(stepsWithWeights)
    const completedSteps = steps.filter(s => s.status === 'completed' || s.status === 'optional-completed').length
    const requiredSteps = steps.filter(s => s.isRequired)
    const requiredCompleted = requiredSteps.filter(s => s.status === 'completed').length
    const requiredComplete = requiredCompleted === requiredSteps.length

    // Category breakdowns
    const critical = {
      completed: steps.filter(s => s.category === 'critical' && s.status === 'completed').length,
      total: steps.filter(s => s.category === 'critical').length
    }
    const recommended = {
      completed: steps.filter(s => s.category === 'recommended' && (s.status === 'completed' || s.status === 'optional-completed')).length,
      total: steps.filter(s => s.category === 'recommended').length
    }
    const optional = {
      completed: steps.filter(s => s.category === 'optional' && (s.status === 'completed' || s.status === 'optional-completed')).length,
      total: steps.filter(s => s.category === 'optional').length
    }

    return {
      overall: overallProgress,
      completed: completedSteps,
      total: steps.length,
      requiredComplete,
      critical,
      recommended,
      optional,
      message: getCompletionMessage(overallProgress, requiredComplete)
    }
  }, [steps])

  // Auto-expand for new events (low progress)
  useEffect(() => {
    if (!isLoading && progress.overall < 25) {
      setIsExpanded(true)
    }
  }, [progress.overall, isLoading])

  // Helper function to parse and update progress optimistically
  const updateProgressOptimistically = (updateFn: (current: any) => any) => {
    try {
      const currentProgress = JSON.parse(optimisticEvent.quickStartProgress || '{}')
      const updatedProgress = updateFn(currentProgress)
      return JSON.stringify(updatedProgress)
    } catch {
      const updatedProgress = updateFn({})
      return JSON.stringify(updatedProgress)
    }
  }

  const handleStepAction = (step: QuickStartStep) => {
    startTransition(async () => {
      // Handle special actions
      if (step.id === 'qr-download') {
        const newProgress = updateProgressOptimistically((current: any) => ({
          ...current,
          qrDownloaded: true,
          lastUpdated: new Date().toISOString()
        }))
        setOptimisticEvent(newProgress)
        await markQRDownloaded(event.id)
      } else if (step.id === 'slideshow-test') {
        const newProgress = updateProgressOptimistically((current: any) => ({
          ...current,
          slideshowTested: true,
          lastUpdated: new Date().toISOString()
        }))
        setOptimisticEvent(newProgress)
        await markSlideshowTested(event.id)
      } else if (step.status === 'optional-completed') {
        // Handle step being marked as complete (including skips)
        if (!step.isRequired) {
          const newProgress = updateProgressOptimistically((current: any) => {
            const stepsSkipped = current.stepsSkipped || []
            return {
              ...current,
              stepsSkipped: stepsSkipped.includes(step.id) ? stepsSkipped : [...stepsSkipped, step.id],
              lastUpdated: new Date().toISOString()
            }
          })
          setOptimisticEvent(newProgress)
          await markStepCompleted(event.id, step.id, true)
        }
      }
    })
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem(`quickstart_dismissed_${event.id}`, 'true')
  }

  const handleReopen = () => {
    setIsDismissed(false)
    localStorage.removeItem(`quickstart_dismissed_${event.id}`)
    setIsExpanded(true)
  }

  // Don't show if dismissed and progress is high  
  if (isDismissed && progress.overall >= 75) {
    return <></>
  }

  // Show minimal reopener if dismissed but progress is low
  if (isDismissed) {
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Rocket className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Quick Start Guide</h3>
                <p className="text-xs text-muted-foreground">
                  {progress.completed} of {progress.total} steps completed
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReopen}
              className="text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
            >
              Resume Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getCardStyling = () => {
    if (progress.overall === 100) {
      return "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
    } else if (progress.overall >= 75) {
      return "border-primary/30 bg-primary/5"
    } else if (progress.overall >= 25) {
      return "border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-950/20"
    }
    return "border-primary/20"
  }

  if (isLoading) {
    return null
  }

  return (
    <Card className={cn(
      "transition-all duration-300",
      getCardStyling(),
      className
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                progress.overall === 100 
                  ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-primary/10 text-primary"
              )}>
                {progress.overall === 100 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Rocket className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Quick Start Guide</CardTitle>
                  {progress.overall === 100 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Complete!
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {progress.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {progress.overall >= 50 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="space-y-3">
            <ProgressIndicator 
              progress={progress.overall} 
              showPercentage={true}
              className="max-w-md"
            />
            <StepProgress 
              completed={progress.completed} 
              total={progress.total}
            />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Category Overview */}
            <CategoryProgress 
              critical={progress.critical}
              recommended={progress.recommended}
              optional={progress.optional}
            />

            {/* Steps List */}
            <StepList 
              steps={steps}
              onStepAction={handleStepAction}
              eventSlug={event.slug}
              groupByCategory={true}
              isPending={isPending}
            />

            {/* Completion Actions */}
            {progress.overall === 100 && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                      🎉 Your gallery is ready!
                    </h3>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      You've completed all the essential setup steps. Your guests can now enjoy your beautiful gallery!
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDismiss}
                    className="border-green-200 text-green-700 hover:bg-green-100 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/20"
                  >
                    Dismiss Guide
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
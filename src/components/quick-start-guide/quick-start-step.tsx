"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, ChevronRight, ExternalLink, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { QuickStartStep as QuickStartStepType } from "./step-definitions"

interface QuickStartStepProps {
  step: QuickStartStepType
  onAction?: (step: QuickStartStepType) => void
  eventSlug?: string
  className?: string
  isPending?: boolean
}

export function QuickStartStep({ step, onAction, eventSlug, className, isPending = false }: QuickStartStepProps) {
  const [isHovered, setIsHovered] = useState(false)

  const isCompleted = step.status === 'completed' || step.status === 'optional-completed'
  const isSkipped = step.status === 'optional-skipped'
  
  const handleAction = () => {
    if (step.actionType === 'scroll' && step.actionTarget) {
      // Scroll to target element
      const element = document.getElementById(step.actionTarget) || 
                    document.querySelector(`[data-section="${step.actionTarget}"]`)
      if (element) {
        // Use a timeout to ensure DOM is ready
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
        }, 100)
      } else {
        console.warn(`Scroll target not found: ${step.actionTarget}`)
      }
    } else if (step.actionType === 'external' && step.actionTarget && eventSlug) {
      // Navigate to external URL
      const url = step.actionTarget.replace('[slug]', eventSlug)
      window.open(url, '_blank')
      
      // For slideshow test, trigger the action when link is clicked
      if (step.id === 'slideshow-test' && onAction) {
        onAction(step)
      }
    } else if (onAction) {
      onAction(step)
    }
  }

  const getCategoryBadge = () => {
    if (step.category === 'critical') {
      return <Badge variant="destructive" className="text-xs">Essential</Badge>
    } else if (step.category === 'recommended') {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Recommended</Badge>
    } else {
      return <Badge variant="outline" className="text-xs">Optional</Badge>
    }
  }

  const getStatusIcon = () => {
    if (isCompleted) {
      return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
    } else if (isSkipped) {
      return <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    } else {
      return <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    }
  }

  const getActionButton = () => {
    if (isCompleted) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="text-green-600 hover:text-green-700"
          disabled
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Complete
        </Button>
      )
    }

    if (!step.isRequired && step.status === 'incomplete') {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAction}
            disabled={isPending}
            className="hover:bg-primary hover:text-primary-foreground"
          >
            {step.actionType === 'external' && <ExternalLink className="h-4 w-4 mr-1" />}
            {step.actionType === 'scroll' && <ArrowDown className="h-4 w-4 mr-1" />}
            {step.actionLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Mark as completed when skipped (shows as ticked)
              if (onAction) {
                onAction({ ...step, status: 'optional-completed' } as QuickStartStepType)
              }
            }}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            Mark Complete
          </Button>
        </div>
      )
    }

    return (
      <Button
        variant={step.isRequired ? "default" : "outline"}
        size="sm"
        onClick={handleAction}
        disabled={isPending}
        className={cn(
          "hover:bg-primary hover:text-primary-foreground",
          step.isRequired && "bg-primary text-primary-foreground"
        )}
      >
        {step.actionType === 'external' && <ExternalLink className="h-4 w-4 mr-1" />}
        {step.actionType === 'scroll' && <ArrowDown className="h-4 w-4 mr-1" />}
        {step.actionLabel}
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-4 p-4 rounded-lg border transition-all duration-200",
        isCompleted 
          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
          : isHovered
            ? "bg-muted/50 border-border"
            : "bg-background border-border hover:bg-muted/30",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Icon */}
      <div className="pt-0.5">
        {getStatusIcon()}
      </div>

      {/* Step Icon */}
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0",
        isCompleted 
          ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
      )}>
        <step.icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                "font-medium text-sm",
                isCompleted 
                  ? "text-green-700 dark:text-green-300"
                  : "text-foreground"
              )}>
                {step.title}
              </h4>
              {getCategoryBadge()}
            </div>
            <p className={cn(
              "text-xs leading-relaxed",
              isCompleted 
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground"
            )}>
              {step.description}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            {getActionButton()}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StepListProps {
  steps: QuickStartStepType[]
  onStepAction?: (step: QuickStartStepType) => void
  eventSlug?: string
  groupByCategory?: boolean
  className?: string
  isPending?: boolean
}

export function StepList({ 
  steps, 
  onStepAction, 
  eventSlug, 
  groupByCategory = false,
  className,
  isPending = false
}: StepListProps) {
  if (groupByCategory) {
    const criticalSteps = steps.filter(s => s.category === 'critical')
    const recommendedSteps = steps.filter(s => s.category === 'recommended')
    const optionalSteps = steps.filter(s => s.category === 'optional')

    return (
      <div className={cn("space-y-6", className)}>
        {criticalSteps.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Essential Steps
            </h3>
            <div className="space-y-3">
              {criticalSteps.map((step) => (
                <QuickStartStep
                  key={step.id}
                  step={step}
                  onAction={onStepAction}
                  eventSlug={eventSlug}
                  isPending={isPending}
                />
              ))}
            </div>
          </div>
        )}

        {recommendedSteps.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Recommended Steps
            </h3>
            <div className="space-y-3">
              {recommendedSteps.map((step) => (
                <QuickStartStep
                  key={step.id}
                  step={step}
                  onAction={onStepAction}
                  eventSlug={eventSlug}
                  isPending={isPending}
                />
              ))}
            </div>
          </div>
        )}

        {optionalSteps.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Optional Steps
            </h3>
            <div className="space-y-3">
              {optionalSteps.map((step) => (
                <QuickStartStep
                  key={step.id}
                  step={step}
                  onAction={onStepAction}
                  eventSlug={eventSlug}
                  isPending={isPending}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step) => (
        <QuickStartStep
          key={step.id}
          step={step}
          onAction={onStepAction}
          eventSlug={eventSlug}
          isPending={isPending}
        />
      ))}
    </div>
  )
}
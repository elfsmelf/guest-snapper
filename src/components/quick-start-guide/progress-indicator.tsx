"use client"

import { CheckCircle2, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  progress: number
  className?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'bar' | 'circle' | 'mini'
}

export function ProgressIndicator({ 
  progress, 
  className, 
  showPercentage = true, 
  size = 'md',
  variant = 'bar' 
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const circleSize = {
    sm: 32,
    md: 40,
    lg: 48
  }

  if (variant === 'circle') {
    const radius = circleSize[size] / 2 - 4
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg 
          width={circleSize[size]} 
          height={circleSize[size]} 
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={circleSize[size] / 2}
            cy={circleSize[size] / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx={circleSize[size] / 2}
            cy={circleSize[size] / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              "text-primary transition-all duration-500 ease-out",
              progress === 100 && "text-green-500"
            )}
            strokeLinecap="round"
          />
        </svg>
        {showPercentage && (
          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
            {progress}%
          </span>
        )}
      </div>
    )
  }

  if (variant === 'mini') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {progress === 100 ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : progress > 0 ? (
          <Clock className="h-4 w-4 text-yellow-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        {showPercentage && (
          <span className="text-sm text-muted-foreground">{progress}%</span>
        )}
      </div>
    )
  }

  // Default bar variant
  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "w-full rounded-full bg-muted overflow-hidden",
        sizeClasses[size]
      )}>
        <div 
          className={cn(
            "transition-all duration-500 ease-out rounded-full",
            progress === 100 
              ? "bg-green-500" 
              : "bg-primary",
            sizeClasses[size]
          )}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-muted-foreground">
            Progress
          </span>
          <span className="text-xs font-medium">
            {progress}%
          </span>
        </div>
      )}
    </div>
  )
}

interface StepProgressProps {
  completed: number
  total: number
  className?: string
}

export function StepProgress({ completed, total, className }: StepProgressProps) {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ProgressIndicator 
        progress={progress} 
        variant="mini" 
        showPercentage={false}
      />
      <div className="flex items-center gap-1 text-sm">
        <span className="font-medium">{completed}</span>
        <span className="text-muted-foreground">of</span>
        <span className="text-muted-foreground">{total}</span>
        <span className="text-muted-foreground">complete</span>
      </div>
    </div>
  )
}

interface CategoryProgressProps {
  critical: { completed: number; total: number }
  recommended: { completed: number; total: number }
  optional: { completed: number; total: number }
  className?: string
}

export function CategoryProgress({ 
  critical, 
  recommended, 
  optional, 
  className 
}: CategoryProgressProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm font-medium">Essential</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {critical.completed}/{critical.total}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-sm font-medium">Recommended</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {recommended.completed}/{recommended.total}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Optional</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {optional.completed}/{optional.total}
        </span>
      </div>
    </div>
  )
}
/**
 * CVA-powered gallery primitives
 * Theme-aware components using semantic design tokens
 */

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// ===== HEADING COMPONENT =====
const headingVariants = cva(
  "gallery-heading font-bold leading-tight tracking-tight",
  {
    variants: {
      level: {
        1: "gallery-heading-1",
        2: "gallery-heading-2", 
        3: "gallery-heading-3",
        4: "text-xl md:text-2xl",
        5: "text-lg md:text-xl",
        6: "text-base md:text-lg",
      },
      color: {
        default: "text-fg",
        primary: "text-primary",
        secondary: "text-secondary",
        accent: "text-accent",
        muted: "text-muted",
        destructive: "text-destructive",
        success: "text-success",
        warning: "text-warning",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
        black: "font-black",
      }
    },
    defaultVariants: {
      level: 1,
      color: "default",
      weight: "bold",
    },
  }
)

export interface GalleryHeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'color'>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const GalleryHeading = forwardRef<HTMLHeadingElement, GalleryHeadingProps>(
  ({ className, level, color, weight, as, ...props }, ref) => {
    const Comp = as || `h${level || 1}` as any
    return (
      <Comp
        className={cn(headingVariants({ level, color, weight, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GalleryHeading.displayName = "GalleryHeading"

// ===== TEXT COMPONENT =====
const textVariants = cva(
  "gallery-text",
  {
    variants: {
      size: {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
      },
      color: {
        default: "text-fg",
        primary: "text-primary",
        secondary: "text-secondary",
        accent: "text-accent",
        muted: "text-muted",
        destructive: "text-destructive",
        success: "text-success",
        warning: "text-warning",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      font: {
        sans: "gallery-sans",
        serif: "gallery-serif",
        mono: "gallery-mono",
      }
    },
    defaultVariants: {
      size: "base",
      color: "default",
      weight: "normal",
      font: "sans",
    },
  }
)

export interface GalleryTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "time" | "em" | "strong"
}

const GalleryText = forwardRef<HTMLElement, GalleryTextProps>(
  ({ className, size, color, weight, font, as = "p", ...props }, ref) => {
    const Comp = as as any
    return (
      <Comp
        className={cn(textVariants({ size, color, weight, font, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GalleryText.displayName = "GalleryText"

// ===== BUTTON COMPONENT =====
const galleryButtonVariants = cva(
  "inline-flex items-center justify-center rounded-themed font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
        accent: "bg-accent text-accent-foreground hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-themed-sm px-3",
        lg: "h-14 rounded-themed-lg px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface GalleryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof galleryButtonVariants> {}

const GalleryButton = forwardRef<HTMLButtonElement, GalleryButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(galleryButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GalleryButton.displayName = "GalleryButton"

// ===== CARD COMPONENT =====
const galleryCardVariants = cva(
  "rounded-themed-lg border border-border bg-card text-card-foreground shadow-themed",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      elevated: {
        false: "",
        true: "shadow-themed-lg",
      }
    },
    defaultVariants: {
      padding: "default",
      elevated: false,
    },
  }
)

export interface GalleryCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof galleryCardVariants> {}

const GalleryCard = forwardRef<HTMLDivElement, GalleryCardProps>(
  ({ className, padding, elevated, ...props }, ref) => {
    return (
      <div
        className={cn(galleryCardVariants({ padding, elevated, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GalleryCard.displayName = "GalleryCard"

// ===== BADGE COMPONENT =====
const galleryBadgeVariants = cva(
  "inline-flex items-center rounded-themed-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:opacity-80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:opacity-80",
        accent: "border-transparent bg-accent text-accent-foreground hover:opacity-80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:opacity-80",
        success: "border-transparent bg-success text-success-foreground hover:opacity-80",
        warning: "border-transparent bg-warning text-warning-foreground hover:opacity-80",
        outline: "text-fg border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface GalleryBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof galleryBadgeVariants> {}

function GalleryBadge({ className, variant, ...props }: GalleryBadgeProps) {
  return (
    <div className={cn(galleryBadgeVariants({ variant }), className)} {...props} />
  )
}

// Export all components
export {
  GalleryHeading,
  GalleryText,
  GalleryButton,
  GalleryCard,
  GalleryBadge,
  headingVariants,
  textVariants,
  galleryButtonVariants,
  galleryCardVariants,
  galleryBadgeVariants,
}
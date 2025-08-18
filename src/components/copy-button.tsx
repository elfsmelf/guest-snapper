"use client"

import { Button } from "@/components/ui/button"

interface CopyButtonProps {
  text: string
  children?: React.ReactNode
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function CopyButton({ text, children = "Copy", variant = "outline", size = "sm", className }: CopyButtonProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
    >
      {children}
    </Button>
  )
}
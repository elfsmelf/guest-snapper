"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CopyButtonProps {
  text: string
  children?: React.ReactNode
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function CopyButton({ text, children = "Copy", variant = "outline", size = "sm", className }: CopyButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Link copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy link")
    }
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
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EyeOff } from "lucide-react"

interface ViewAsPublicButtonProps {
  galleryUrl: string
  className?: string
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ViewAsPublicButton({ 
  galleryUrl, 
  className,
  variant = "secondary",
  size = "default"
}: ViewAsPublicButtonProps) {
  // Add ?view=public parameter to force public view
  const publicUrl = `${galleryUrl}?view=public`

  return (
    <Button 
      asChild
      variant={variant}
      size={size}
      className={className}
      title="Preview how the gallery appears to public visitors (opens in new tab)"
    >
      <Link href={publicUrl} target="_blank" prefetch={false}>
        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        <span className="sm:hidden">Public View</span>
        <span className="hidden sm:inline">View as Public</span>
      </Link>
    </Button>
  )
}
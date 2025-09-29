"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Loader2, CheckCircle, Smartphone, Camera, Share, Copy, ExternalLink, Palette } from "lucide-react"
import { toast } from "sonner"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"
import { QRCodeGenerator } from "@/components/qr-code-generator"

interface QRCodeStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function QRCodeStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: QRCodeStepProps) {
  const [hasDownloaded, setHasDownloaded] = useState(false)

  const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gallery/${eventSlug}`

  const handleQRDownload = async () => {
    setHasDownloaded(true)
    // Update onboarding progress immediately when QR is downloaded
    onUpdate({ qrDownloaded: true })
    
    // Also persist to database
    try {
      await updateOnboardingProgress(eventId, { qrDownloaded: true })
    } catch (error) {
      console.error('Failed to update QR download progress:', error)
    }
    
    toast.success('QR code downloaded successfully!')
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(galleryUrl)
      toast.success('Gallery URL copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy URL:', error)
      toast.error('Failed to copy URL')
    }
  }

  const handleNavigateToGallery = () => {
    window.open(galleryUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Share your gallery with guests using this QR code. They can scan it with their phone to instantly access your gallery.
        </p>
      </div>

      {/* Landscape Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Your Gallery QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QRCodeGenerator
              value={galleryUrl}
              size={200}
              eventId={eventId}
              onDownload={handleQRDownload}
            />
            {hasDownloaded && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                QR code downloaded!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share className="w-5 h-5" />
              How to Share
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gallery URL */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Gallery URL</div>
              <div className="p-3 bg-muted rounded-lg border flex items-center justify-between gap-3">
                <code className="text-sm break-all flex-1">{galleryUrl}</code>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="h-8 w-8 p-0"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNavigateToGallery}
                    className="h-8 w-8 p-0"
                    title="Open Gallery"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Ways to share:</div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Print the QR Code</div>
                    <div className="text-xs text-muted-foreground">Display at your event entrance or on invitations</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Camera className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Share Digitally</div>
                    <div className="text-xs text-muted-foreground">Send via text, email, or social media</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Share className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Include in Invitations</div>
                    <div className="text-xs text-muted-foreground">Add to wedding programs, save-the-dates, or table cards</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tip</div>
              <div className="text-xs text-blue-700">
                Guests can scan the QR code with their phone's camera app - no special app needed! 
                It works on both iPhone and Android devices.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Canva Templates Section */}
      <Card className="bg-gradient-to-r from-secondary/30 to-accent/30 border-secondary">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Free Canva Templates</h3>
              </div>

              <p className="text-foreground/80 leading-relaxed">
                We want you to get the most out of your digital gallery. That's why we've made these editable templates using the free version of Canva. Easily update with your unique QR code, personalise with your names and edit your message. Instructions are included in the link.
              </p>

              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> you'll need to sign up for a free version of Canva to use these.
              </p>

              <Button
                onClick={() => window.open('/canva-templates', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View our templates
              </Button>
            </div>

            {/* Hero Image */}
            <div className="order-first lg:order-last">
              <div className="relative rounded-lg overflow-hidden shadow-lg aspect-square">
                <img
                  src="https://assets.guestsnapper.com/marketing/gallery/welcome%20sign.jpg"
                  alt="Canva template examples for QR codes"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasDownloaded && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You can always download the QR code later from your gallery dashboard
          </p>
        </div>
      )}
    </div>
  )
}
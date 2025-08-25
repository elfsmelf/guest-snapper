"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Eye } from "lucide-react"
import { type OnboardingState } from "@/types/onboarding"
import { UploadInterface } from "@/components/upload/upload-interface"

interface TestImagesStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function TestImagesStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: TestImagesStepProps) {
  const router = useRouter()

  // Check completion status
  const isComplete = state.testImagesUploaded && state.testImageCount > 0

  // Create event object for UploadInterface
  const eventForUpload = {
    id: eventId,
    name: eventName,
    coupleNames: eventName,
    eventDate: new Date().toISOString(),
    slug: eventSlug,
    userId: '',
    uploadWindowEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    albums: []
  }



  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-muted-foreground/20"></div>
        <span className="text-sm font-medium text-muted-foreground">STEP 1</span>
        <div className="flex-1 border-t border-muted-foreground/20"></div>
      </div>

      {/* Instructions */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Let's Upload Some Test Photos</h3>
        <p className="text-muted-foreground">
          Start by uploading a few test photos to see how your gallery looks. 
          Don't worry - you can delete these later!
        </p>
      </div>

      {isComplete ? (
        <div className="space-y-6">
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Great! You've uploaded {state.testImageCount} test {state.testImageCount === 1 ? 'image' : 'images'}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your gallery is starting to look amazing!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Gallery Button */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push(`/gallery/${eventSlug}`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Gallery
            </Button>
          </div>
        </div>
      ) : (
        /* Upload Interface */
        <UploadInterface
          event={eventForUpload}
          uploadWindowOpen={true}
          isOwner={true}
          guestCanUpload={true}
          isOnboardingStep={true}
          onUploadComplete={(uploadCount) => {
            // Update onboarding state when uploads complete
            onUpdate({
              testImagesUploaded: true,
              testImageCount: uploadCount
            })
          }}
        />
      )}
    </div>
  )
}
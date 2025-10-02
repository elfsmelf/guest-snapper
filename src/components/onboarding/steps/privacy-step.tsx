"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Shield, Eye, EyeOff, CheckCircle, Loader2, Users, Lock, Camera, Download, MessageSquare, Mic } from "lucide-react"
import { toast } from "sonner"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"
import { useEventData } from "@/hooks/use-onboarding"

interface PrivacyStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function PrivacyStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: PrivacyStepProps) {
  // Use prefetched event data
  const { data: eventData, isLoading } = useEventData(eventId)

  // Parse privacy settings from JSON
  const getPrivacySettings = () => {
    try {
      return eventData?.privacySettings ? JSON.parse(eventData.privacySettings) : {}
    } catch {
      return {}
    }
  }

  const privacySettings = getPrivacySettings()
  const [guestCanView, setGuestCanView] = useState(eventData?.guestCanViewAlbum ?? true)
  const [guestCanViewGuestbook, setGuestCanViewGuestbook] = useState(eventData?.guestCanViewGuestbook ?? true)
  const [guestCanViewAudioMessages, setGuestCanViewAudioMessages] = useState(eventData?.guestCanViewAudioMessages ?? true)
  const [approveUploads, setApproveUploads] = useState(eventData?.approveUploads ?? false)
  const [allowGuestDownloads, setAllowGuestDownloads] = useState(privacySettings.allow_guest_downloads ?? false)
  const [isUpdating, setIsUpdating] = useState(false)
  const isComplete = state.privacyConfigured

  const updateEventSettings = async (updates: any) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/events/${eventId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      toast.success('Privacy settings updated!')
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast.error('Failed to update settings')
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  const handleGuestViewChange = async (checked: boolean) => {
    const previousValue = guestCanView
    // Optimistic update - update UI immediately
    setGuestCanView(checked)

    try {
      await updateEventSettings({
        guestCanViewAlbum: checked,
      })
    } catch (error) {
      // Revert on error
      setGuestCanView(previousValue)
    }
  }

  const handleGuestViewGuestbookChange = async (checked: boolean) => {
    const previousValue = guestCanViewGuestbook
    // Optimistic update - update UI immediately
    setGuestCanViewGuestbook(checked)

    try {
      await updateEventSettings({
        guestCanViewGuestbook: checked,
      })
    } catch (error) {
      // Revert on error
      setGuestCanViewGuestbook(previousValue)
    }
  }

  const handleGuestViewAudioMessagesChange = async (checked: boolean) => {
    const previousValue = guestCanViewAudioMessages
    // Optimistic update - update UI immediately
    setGuestCanViewAudioMessages(checked)

    try {
      await updateEventSettings({
        guestCanViewAudioMessages: checked,
      })
    } catch (error) {
      // Revert on error
      setGuestCanViewAudioMessages(previousValue)
    }
  }

  const handleApproveUploadsChange = async (checked: boolean) => {
    const previousValue = approveUploads
    // Optimistic update - update UI immediately
    setApproveUploads(checked)

    try {
      await updateEventSettings({
        approveUploads: checked,
      })
    } catch (error) {
      // Revert on error
      setApproveUploads(previousValue)
    }
  }

  const handleAllowGuestDownloadsChange = async (checked: boolean) => {
    const previousValue = allowGuestDownloads
    // Optimistic update - update UI immediately
    setAllowGuestDownloads(checked)

    try {
      // Update privacy settings JSON
      const currentPrivacySettings = getPrivacySettings()
      const updatedPrivacySettings = {
        ...currentPrivacySettings,
        allow_guest_downloads: checked
      }

      await updateEventSettings({
        privacySettings: JSON.stringify(updatedPrivacySettings),
      })
    } catch (error) {
      // Revert on error
      setAllowGuestDownloads(previousValue)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Step Introduction */}
      <div className="text-center space-y-3 px-2">
        <p className="text-sm sm:text-base text-muted-foreground">
          Control who can view your gallery and how uploads are moderated. You can change these settings anytime.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex-1 border-t border-muted-foreground/20"></div>
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">STEP 3</span>
        <div className="flex-1 border-t border-muted-foreground/20"></div>
      </div>

      {isComplete ? (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Privacy settings configured!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your gallery privacy is set up according to your preferences.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Moderation Settings
              {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Guest can view album */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Guest can view gallery</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Allow guests to view photos and videos in the gallery
                </div>
              </div>
              <Switch 
                checked={guestCanView === null ? false : guestCanView}
                onCheckedChange={handleGuestViewChange}
                className="data-[state=checked]:bg-primary"
                disabled={isUpdating || isLoading}
              />
            </div>

            {/* Guest can view guestbook */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Allow guests to view guestbook messages</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Let guests see guestbook messages from other guests
                </div>
              </div>
              <Switch
                checked={guestCanViewGuestbook ?? true}
                onCheckedChange={handleGuestViewGuestbookChange}
                className="data-[state=checked]:bg-primary"
                disabled={isUpdating || isLoading}
              />
            </div>

            {/* Guest can view audio messages */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Allow guests to view audio messages</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Let guests listen to audio messages from other guests
                </div>
              </div>
              <Switch
                checked={guestCanViewAudioMessages ?? true}
                onCheckedChange={handleGuestViewAudioMessagesChange}
                className="data-[state=checked]:bg-primary"
                disabled={isUpdating || isLoading}
              />
            </div>

            {/* Approve Uploads */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Approve uploads</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Manually review and approve photos before they appear in the gallery
                </div>
              </div>
              <Switch
                checked={approveUploads ?? false}
                onCheckedChange={handleApproveUploadsChange}
                className="data-[state=checked]:bg-primary"
                disabled={isUpdating || isLoading}
              />
            </div>

            {/* Allow Guest Downloads */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Allow guest downloads</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Let guests download photos and videos from the gallery
                </div>
              </div>
              <Switch
                checked={allowGuestDownloads ?? false}
                onCheckedChange={handleAllowGuestDownloadsChange}
                className="data-[state=checked]:bg-primary"
                disabled={isUpdating || isLoading}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="font-medium mb-2">💡 Pro Tips:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Guest viewing:</strong> Enabled by default so anyone can enjoy your photos</li>
          <li>• <strong>Upload approval:</strong> Disabled for easier sharing - enable if you want to review first</li>
          <li>• <strong>Guest downloads:</strong> Disabled by default - enable to let guests save photos to their devices</li>
          <li>• <strong>Default settings:</strong> Optimized for the best guest experience while protecting your content</li>
          <li>• <strong>Change anytime:</strong> You can modify these settings later from your dashboard</li>
        </ul>
      </div>
    </div>
  )
}
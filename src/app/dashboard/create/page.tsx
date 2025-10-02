"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePickerRac } from '@/components/ui/date-picker-rac'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Upload as UploadIcon, X } from 'lucide-react'
import Link from 'next/link'
import { CalendarDate, parseDate } from '@internationalized/date'
import { eventTypes } from '@/lib/event-types'
import Image from 'next/image'
import { toast } from 'sonner'
import { calculateUploadWindowEnd, calculateDownloadWindowEnd } from '@/lib/pricing'
import posthog from 'posthog-js'

export default function CreateGalleryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    eventType: 'wedding',
    venue: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)

  // Get placeholder text based on event type
  const getEventNamePlaceholder = (eventType: string) => {
    switch (eventType) {
      case 'wedding':
        return 'John & Jane Wedding, Smith-Johnson Wedding, etc.'
      case 'party':
        return 'Birthday Bash, Anniversary Party, Graduation Celebration, etc.'
      default:
        return 'My Event'
    }
  }

  const generateSlug = (eventName: string) => {
    return eventName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8)
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB')
        return
      }

      setCoverImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview(null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Event name must be at least 3 characters'
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Please select an event type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const slug = generateSlug(formData.name)
      
      // Start the API call
      const apiCall = fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          name: formData.name,
          venue: formData.venue,
          eventType: formData.eventType,
          date: selectedDate ? new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day) : null,
        }),
      })

      // Generate optimistic event data
      const now = new Date()
      const plan = 'free_trial'
      const optimisticEvent = {
        id: 'temp-' + Date.now(), // Temporary ID
        name: formData.name,
        coupleNames: formData.name, // Keep for backward compatibility
        venue: formData.venue,
        eventDate: selectedDate ? selectedDate.toString() : new Date().toISOString().split('T')[0],
        slug: slug,
        isPublished: false,
        plan,
        currency: 'USD',
        guestCount: 0,
        themeId: 'default',
        realtimeSlideshow: true,
        uploadWindowEnd: calculateUploadWindowEnd(plan, now).toISOString(),
        downloadWindowEnd: calculateDownloadWindowEnd(plan, now).toISOString(),
        createdAt: now.toISOString(),
        coverImageUrl: null
      }

      // Wait for response to get real event ID
      const response = await apiCall
      
      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      const event = await response.json()

      // Upload cover image if provided
      if (coverImage) {
        try {
          // Get presigned URL for cover image upload
          const uploadUrlResponse = await fetch('/api/upload-cover-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: event.id,
              fileName: coverImage.name,
              fileType: coverImage.type,
              fileSize: coverImage.size
            }),
          })

          const uploadUrlResult = await uploadUrlResponse.json()

          if (uploadUrlResult.success) {
            // Upload to R2 using presigned URL
            const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
              method: 'PUT',
              body: coverImage,
              headers: {
                'Content-Type': coverImage.type,
              },
            })

            if (uploadResponse.ok) {
              // Update event with cover image URL using settings endpoint
              await fetch(`/api/events/${event.id}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverImageUrl: uploadUrlResult.fileUrl }),
              })

              optimisticEvent.coverImageUrl = uploadUrlResult.fileUrl
            }
          }
        } catch (uploadError) {
          console.error('Error uploading cover image:', uploadError)
          // Don't fail the whole process if cover upload fails
        }
      }

      // Store optimistic data in sessionStorage for instant loading
      sessionStorage.setItem(`optimistic-event-${event.id}`, JSON.stringify({
        ...optimisticEvent,
        id: event.id // Use real ID
      }))

      // Track event creation in PostHog
      posthog.capture('event_created', {
        event_id: event.id,
        event_type: formData.eventType,
        event_name: formData.name,
        has_cover_image: !!coverImage,
        has_venue: !!formData.venue,
        has_date: !!selectedDate,
      })

      // Initialize onboarding state
      const initResponse = await fetch('/api/events/' + event.id + '/onboarding/init', {
        method: 'POST'
      })

      if (initResponse.ok) {
        // Redirect to dedicated onboarding page
        router.push(`/onboarding?slug=${event.slug}&step=1`)
      } else {
        // Fallback to dashboard if onboarding initialization fails
        router.push(`/dashboard/events/${event.id}`)
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Event Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                type="text"
                placeholder={getEventNamePlaceholder(formData.eventType)}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) {
                    setErrors({ ...errors, name: '' })
                  }
                }}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label>Event Type *</Label>
              <RadioGroup
                value={formData.eventType}
                onValueChange={(value) => {
                  setFormData({ ...formData, eventType: value })
                  if (errors.eventType) {
                    setErrors({ ...errors, eventType: '' })
                  }
                }}
                className="grid grid-cols-2 gap-3 mt-3"
              >
                {Object.values(eventTypes).filter(type => type.id === 'wedding' || type.id === 'party').map((type) => {
                  const IconComponent = type.icon
                  return (
                    <div key={type.id}>
                      <RadioGroupItem
                        value={type.id}
                        id={type.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={type.id}
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 h-20 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all duration-200 group"
                      >
                        <IconComponent className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform duration-200" />
                        <span className="text-xs font-medium text-center leading-tight">{type.label}</span>
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            <div>
              <DatePickerRac
                label="Event Date"
                value={selectedDate}
                onChange={setSelectedDate}
                description="Select the date of your wedding or event"
              />
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                type="text"
                placeholder="Wedding venue name"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>

            <div>
              <Label>Cover Photo (Optional)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Add a beautiful cover photo for your event gallery
              </p>

              {!coverImagePreview ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    id="coverImage"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="coverImage"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <UploadIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Click to upload cover photo</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
                  </Label>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative aspect-video rounded-lg overflow-hidden border">
                    <Image
                      src={coverImagePreview}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeCoverImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Event'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">Please fix the following errors:</p>
                <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                  {errors.name && <li>{errors.name}</li>}
                  {errors.eventType && <li>{errors.eventType}</li>}
                </ul>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
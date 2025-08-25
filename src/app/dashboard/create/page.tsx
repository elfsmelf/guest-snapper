"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePickerRac } from '@/components/ui/date-picker-rac'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CalendarDate, parseDate } from '@internationalized/date'

export default function CreateGalleryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    coupleNames: '',
    eventDate: '',
    venue: '',
  })
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(null)

  const generateSlug = (coupleNames: string) => {
    return coupleNames
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const slug = generateSlug(formData.coupleNames)
      
      // Start the API call
      const apiCall = fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          coupleNames: formData.coupleNames,
          venue: formData.venue,
          date: selectedDate ? new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day) : null,
        }),
      })

      // Generate optimistic event data
      const optimisticEvent = {
        id: 'temp-' + Date.now(), // Temporary ID
        name: formData.coupleNames,
        coupleNames: formData.coupleNames,
        venue: formData.venue,
        eventDate: selectedDate ? selectedDate.toString() : new Date().toISOString().split('T')[0],
        slug: slug,
        isPublished: false,
        plan: 'free',
        currency: 'USD',
        guestCount: 0,
        themeId: 'default',
        realtimeSlideshow: true,
        uploadWindowEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        downloadWindowEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        coverImageUrl: null
      }

      // Wait for response to get real event ID
      const response = await apiCall
      
      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      const event = await response.json()
      
      // Store optimistic data in sessionStorage for instant loading
      sessionStorage.setItem(`optimistic-event-${event.id}`, JSON.stringify({
        ...optimisticEvent,
        id: event.id // Use real ID
      }))

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
              <Label htmlFor="coupleNames">Couple Names *</Label>
              <Input
                id="coupleNames"
                type="text"
                placeholder="John & Jane"
                value={formData.coupleNames}
                onChange={(e) =>
                  setFormData({ ...formData, coupleNames: e.target.value })
                }
                required
              />
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
                onChange={(e) =>
                  setFormData({ ...formData, venue: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading || !formData.coupleNames}>
                {isLoading ? 'Creating...' : 'Create Event'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
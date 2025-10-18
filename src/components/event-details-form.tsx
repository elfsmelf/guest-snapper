"use client"

import { useState, useOptimistic, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePickerRac } from '@/components/ui/date-picker-rac'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CalendarDate, parseDate } from '@internationalized/date'
import { eventTypes } from '@/lib/event-types'
import { Edit, Save, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EventDetailsFormProps {
  event: {
    id: string
    name: string
    venue?: string
    eventType: string
    eventDate: string
  }
  isOwner: boolean
}

interface OptimisticEvent {
  name: string
  venue?: string
  eventType: string
  eventDate: string
}

export function EventDetailsForm({ event, isOwner }: EventDetailsFormProps) {
  // Add error boundary for better error handling
  if (!event || !event.id) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Unable to load event details.</p>
        </CardContent>
      </Card>
    )
  }
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: event.name,
    venue: event.venue || '',
    eventType: event.eventType,
  })
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(() => {
    try {
      // Parse date string directly to avoid timezone conversion
      // If eventDate is "2025-12-19", parseDate expects "2025-12-19"
      const dateStr = event.eventDate.split('T')[0] // Extract YYYY-MM-DD part
      return parseDate(dateStr)
    } catch {
      return null
    }
  })

  // Optimistic state for immediate UI updates
  const [optimisticEvent, updateOptimisticEvent] = useOptimistic(
    {
      name: event.name,
      venue: event.venue || '',
      eventType: event.eventType,
      eventDate: event.eventDate
    },
    (current: OptimisticEvent, newData: OptimisticEvent) => ({
      ...current,
      ...newData
    })
  )

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare update data
      const updateData = {
        name: formData.name,
        venue: formData.venue,
        eventType: formData.eventType,
        eventDate: selectedDate ? new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day).toISOString() : event.eventDate,
      }

      // Optimistically update the UI
      updateOptimisticEvent(updateData)
      setIsEditing(false)

      // Make API call
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update event')
      }

      const updatedEvent = await response.json()

      // Update optimistic state with actual response data
      updateOptimisticEvent({
        name: updatedEvent.name,
        venue: updatedEvent.venue || '',
        eventType: updatedEvent.eventType,
        eventDate: updatedEvent.eventDate
      })

      toast.success('Event details updated successfully!')

      // Refresh the page to update server-rendered components (like hero section)
      window.location.reload()

    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event details')

      // Revert optimistic state
      updateOptimisticEvent({
        name: event.name,
        venue: event.venue || '',
        eventType: event.eventType,
        eventDate: event.eventDate
      })

      // Reset form and editing state
      setFormData({
        name: event.name,
        venue: event.venue || '',
        eventType: event.eventType,
      })
      setIsEditing(true) // Keep editing mode open for retry
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: event.name,
      venue: event.venue || '',
      eventType: event.eventType,
    })
    try {
      const date = new Date(event.eventDate)
      setSelectedDate(parseDate(date.toISOString().split('T')[0]))
    } catch {
      setSelectedDate(null)
    }
    setIsEditing(false)
  }

  if (!isOwner && !isEditing) {
    // Show read-only view for non-owners
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Event Name</Label>
            <p className="text-sm text-muted-foreground mt-1">{optimisticEvent.name}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Event Type</Label>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {eventTypes[optimisticEvent.eventType as keyof typeof eventTypes]?.label || optimisticEvent.eventType}
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Event Date</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(optimisticEvent.eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {optimisticEvent.venue && (
            <div>
              <Label className="text-sm font-medium">Venue</Label>
              <p className="text-sm text-muted-foreground mt-1">{optimisticEvent.venue}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          Event Details
          {!isEditing && isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="eventName">Event Name *</Label>
              <Input
                id="eventName"
                type="text"
                placeholder={getEventNamePlaceholder(formData.eventType)}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Event Type *</Label>
              <RadioGroup
                value={formData.eventType}
                onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                className="grid grid-cols-2 gap-3 mt-3"
              >
                {Object.values(eventTypes).filter(type => type.id === 'wedding' || type.id === 'party').map((type) => {
                  const IconComponent = type.icon
                  return (
                    <div key={type.id}>
                      <RadioGroupItem
                        value={type.id}
                        id={`edit-${type.id}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`edit-${type.id}`}
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
                description="Select the date of your event"
              />
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                type="text"
                placeholder="Event venue name"
                value={formData.venue}
                onChange={(e) =>
                  setFormData({ ...formData, venue: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading || !formData.name}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Event Name</Label>
              <p className="text-sm text-muted-foreground mt-1">{optimisticEvent.name}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Event Type</Label>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {eventTypes[optimisticEvent.eventType as keyof typeof eventTypes]?.label || optimisticEvent.eventType}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Event Date</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(optimisticEvent.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {optimisticEvent.venue && (
              <div>
                <Label className="text-sm font-medium">Venue</Label>
                <p className="text-sm text-muted-foreground mt-1">{optimisticEvent.venue}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
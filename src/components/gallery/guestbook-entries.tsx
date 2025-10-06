"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Calendar } from "lucide-react"

interface GuestbookEntry {
  id: string
  guestName: string
  message: string
  isApproved: boolean
  createdAt: string
}

interface GuestbookEntriesProps {
  eventId: string
  onMessageAdded?: () => void
  customEntries?: GuestbookEntry[] // For guest's own content view
}

export function GuestbookEntries({ eventId, onMessageAdded, customEntries }: GuestbookEntriesProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Function to add optimistic entry
  const addOptimisticEntry = (guestName: string, message: string) => {
    const optimisticEntry: GuestbookEntry = {
      id: `temp-${Date.now()}`,
      guestName,
      message,
      isApproved: true,
      createdAt: new Date().toISOString(),
    }
    setEntries(prev => [optimisticEntry, ...prev])
  }

  // Expose the addOptimisticEntry function to parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addGuestbookEntry = addOptimisticEntry
    }
  }, [])

  useEffect(() => {
    // If custom entries are provided, use them instead of fetching
    if (customEntries) {
      setEntries(customEntries)
      setLoading(false)
      return
    }

    const fetchEntries = async () => {
      try {
        const response = await fetch(`/api/guestbook/${eventId}`)
        if (response.ok) {
          const data = await response.json()
          // Check if guestbook viewing is disabled
          if (data.success === false) {
            setEntries([])
          } else {
            setEntries(data.entries || [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch guestbook entries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [eventId, customEntries])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No messages yet</h3>
        <p className="text-muted-foreground">
          Be the first to leave a message for this special event!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries
        .filter(entry => entry.isApproved)
        .map((entry) => (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{entry.guestName}</span>
                    <Badge variant="secondary" className="text-xs">
                      Message
                    </Badge>
                  </div>
                  
                  <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                    {entry.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  )
}
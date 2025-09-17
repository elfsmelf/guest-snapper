import { Heart, PartyPopper, Building, Users, Camera } from 'lucide-react'

export type EventType = 'wedding' | 'party' | 'corporate' | 'memorial' | 'vacation'

export interface EventTypeInfo {
  id: EventType
  label: string
  icon: typeof Heart
  description: string
  possessiveLabel: string // For "[Name]'s [EventType]"
}

export const eventTypes: Record<EventType, EventTypeInfo> = {
  wedding: {
    id: 'wedding',
    label: 'Wedding',
    icon: Heart,
    description: 'Wedding celebration and ceremony',
    possessiveLabel: 'Wedding'
  },
  party: {
    id: 'party',
    label: 'Party',
    icon: PartyPopper,
    description: 'Birthday, celebration, or social gathering',
    possessiveLabel: 'Party'
  },
  corporate: {
    id: 'corporate',
    label: 'Corporate Event',
    icon: Building,
    description: 'Business meeting, conference, or team building',
    possessiveLabel: 'Corporate Event'
  },
  memorial: {
    id: 'memorial',
    label: 'Memorial',
    icon: Users,
    description: 'Memorial service or remembrance gathering',
    possessiveLabel: 'Memorial'
  },
  vacation: {
    id: 'vacation',
    label: 'Vacation',
    icon: Camera,
    description: 'Travel, vacation, or holiday memories',
    possessiveLabel: 'Vacation'
  }
}

export function getEventTypeInfo(eventType: string): EventTypeInfo {
  return eventTypes[eventType as EventType] || eventTypes.wedding
}

export function formatEventTitle(coupleNames: string, eventType: string): string {
  const typeInfo = getEventTypeInfo(eventType)
  return `${coupleNames}'s ${typeInfo.possessiveLabel}`
}

export function getEventTypeIcon(eventType: string) {
  return getEventTypeInfo(eventType).icon
}
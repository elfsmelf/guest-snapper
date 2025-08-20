import { db } from "@/database/db"
import { events } from "@/database/schema"
import { members } from "@/../auth-schema"
import { eq, and, or, isNotNull } from "drizzle-orm"

/**
 * Check if a user can access an event (either as owner or organization member)
 */
export async function canUserAccessEvent(eventId: string, userId: string): Promise<boolean> {
  const event = await db
    .select()
    .from(events)
    .where(and(
      eq(events.id, eventId),
      eq(events.status, 'active') // Only allow access to active events
    ))
    .limit(1)

  if (!event.length) return false
  
  const eventData = event[0]
  
  // Check if user is event owner
  if (eventData.userId === userId) return true
  
  // Check if user is member of the event's organization
  if (eventData.organizationId) {
    const membership = await db
      .select()
      .from(members)
      .where(and(
        eq(members.userId, userId),
        eq(members.organizationId, eventData.organizationId)
      ))
      .limit(1)
    
    return membership.length > 0
  }
  
  return false
}

/**
 * Get event data if user has access, otherwise return null
 */
export async function getEventWithAccess(eventId: string, userId: string) {
  const event = await db
    .select()
    .from(events)
    .where(and(
      eq(events.id, eventId),
      eq(events.status, 'active') // Only allow access to active events
    ))
    .limit(1)

  if (!event.length) return null
  
  const eventData = event[0]
  
  // Check if user is event owner
  const isOwner = eventData.userId === userId
  
  // Check if user is member of the event's organization
  let isOrgMember = false
  if (eventData.organizationId) {
    const membership = await db
      .select()
      .from(members)
      .where(and(
        eq(members.userId, userId),
        eq(members.organizationId, eventData.organizationId)
      ))
      .limit(1)
    
    isOrgMember = membership.length > 0
  }

  if (!isOwner && !isOrgMember) return null

  return {
    event: eventData,
    isOwner,
    isOrgMember
  }
}

/**
 * Middleware-style function to validate event access
 * Throws error if no access, returns event data if access is granted
 */
export async function validateEventAccess(eventId: string, userId: string) {
  const result = await getEventWithAccess(eventId, userId)
  
  if (!result) {
    throw new Error('Event not found or access denied')
  }
  
  return result
}

/**
 * Get all events that a user can access (owned + organization events)
 * Used for dashboard and similar pages
 * Returns events with ownership information
 */
export async function getUserAccessibleEvents(userId: string) {
  // Get user's organization memberships
  const userMemberships = await db
    .select({ organizationId: members.organizationId })
    .from(members)
    .where(eq(members.userId, userId))

  const userOrganizationIds = userMemberships.map(m => m.organizationId)

  // Build conditions: either owned by user OR from organizations they're members of
  const whereConditions = [eq(events.userId, userId)]
  
  if (userOrganizationIds.length > 0) {
    const orgConditions = userOrganizationIds.map(orgId => eq(events.organizationId, orgId))
    if (orgConditions.length === 1) {
      whereConditions.push(orgConditions[0])
    } else if (orgConditions.length > 1) {
      whereConditions.push(
        or(...orgConditions) as any
      )
    }
  }

  const allEvents = await db
    .select()
    .from(events)
    .where(and(
      or(...whereConditions),
      eq(events.status, 'active') // Only show active events in user accessible events
    ))
    .orderBy(events.createdAt)

  // Add ownership information to each event
  return allEvents.map(event => ({
    ...event,
    isOwner: event.userId === userId,
    isMember: event.userId !== userId // If not owner, then they're a member
  }))
}

/**
 * Admin function to get event regardless of status
 * Should only be used by admin endpoints
 */
export async function getEventWithAccessAdmin(eventId: string, userId: string) {
  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  if (!event.length) return null
  
  const eventData = event[0]
  
  // Check if user is event owner
  const isOwner = eventData.userId === userId
  
  // Check if user is member of the event's organization
  let isOrgMember = false
  if (eventData.organizationId) {
    const membership = await db
      .select()
      .from(members)
      .where(and(
        eq(members.userId, userId),
        eq(members.organizationId, eventData.organizationId)
      ))
      .limit(1)
    
    isOrgMember = membership.length > 0
  }

  if (!isOwner && !isOrgMember) return null

  return {
    event: eventData,
    isOwner,
    isOrgMember
  }
}

/**
 * Get all events including trashed ones for admin purposes
 */
export async function getUserAccessibleEventsAdmin(userId: string) {
  // Get user's organization memberships
  const userMemberships = await db
    .select({ organizationId: members.organizationId })
    .from(members)
    .where(eq(members.userId, userId))

  const userOrganizationIds = userMemberships.map(m => m.organizationId)

  // Build conditions: either owned by user OR from organizations they're members of
  const whereConditions = [eq(events.userId, userId)]
  
  if (userOrganizationIds.length > 0) {
    const orgConditions = userOrganizationIds.map(orgId => eq(events.organizationId, orgId))
    if (orgConditions.length === 1) {
      whereConditions.push(orgConditions[0])
    } else if (orgConditions.length > 1) {
      whereConditions.push(
        or(...orgConditions) as any
      )
    }
  }

  const allEvents = await db
    .select()
    .from(events)
    .where(or(...whereConditions))
    .orderBy(events.createdAt)

  // Add ownership information to each event
  return allEvents.map(event => ({
    ...event,
    isOwner: event.userId === userId,
    isMember: event.userId !== userId // If not owner, then they're a member
  }))
}
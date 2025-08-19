import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/database/db'
import { events } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { validateEventAccess, getEventWithAccess } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params

    // Verify the user can access this event (owner or organization member)  
    let event
    try {
      const result = await validateEventAccess(eventId, session.user.id)
      event = result.event
    } catch (error) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // If event already has an organization, return it
    if (event.organizationId) {
      return NextResponse.json({
        success: true,
        organizationId: event.organizationId,
        message: 'Event already has an organization'
      })
    }

    // Create organization using Better Auth API
    const organizationResult = await (auth.api as any).createOrganization({
      headers: await headers(),
      body: {
        name: `${event.coupleNames} - ${event.name}`,
        slug: `${event.slug}-org`,
        metadata: {
          eventId: eventId,
          eventSlug: event.slug,
          createdFor: 'event-collaboration'
        }
      }
    })

    if (!organizationResult) {
      throw new Error('Failed to create organization')
    }

    // Update the event with the organization ID
    await db
      .update(events)
      .set({
        organizationId: organizationResult.id,
        updatedAt: new Date().toISOString()
      })
      .where(eq(events.id, eventId))

    return NextResponse.json({
      success: true,
      organizationId: organizationResult.id,
      organization: organizationResult
    })

  } catch (error) {
    console.error('Organization creation failed:', error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params

    // Get event and check if user has access (owner or member of organization)
    let event, isOwner, isOrgMember
    try {
      const result = await getEventWithAccess(eventId, session.user.id)
      if (!result) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      event = result.event
      isOwner = result.isOwner
      isOrgMember = result.isOrgMember
    } catch (error) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get organization details if it exists
    let organization = null
    let members: any[] = []
    let invitations: any[] = []

    if (event.organizationId) {
      const [fullOrg, orgInvitations] = await Promise.all([
        (auth.api as any).getFullOrganization({
          headers: await headers(),
          query: {
            organizationId: event.organizationId
          }
        }),
        (auth.api as any).listInvitations({
          headers: await headers(),
          query: {
            organizationId: event.organizationId
          }
        }).catch((error: any) => {
          console.error('Failed to fetch invitations:', error)
          return []
        })
      ])

      if (fullOrg) {
        organization = {
          id: fullOrg.id,
          name: fullOrg.name,
          slug: fullOrg.slug,
          logo: fullOrg.logo,
          metadata: fullOrg.metadata,
          createdAt: fullOrg.createdAt
        }
        members = fullOrg.members || []
      }
      
      // Filter out canceled/rejected invitations - only show pending ones
      invitations = (orgInvitations || []).filter((invitation: any) => 
        invitation.status === 'pending'
      )
      
      console.log('Returning organization data:', {
        organizationId: organization?.id,
        membersCount: members.length,
        invitationsCount: invitations.length,
        allInvitations: (orgInvitations || []).map((i: any) => ({ id: i.id, email: i.email, status: i.status })),
        pendingInvitations: invitations.map((i: any) => ({ id: i.id, email: i.email, status: i.status }))
      })
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        organizationId: event.organizationId,
        isOwner,
        hasOrgAccess: isOrgMember
      },
      organization,
      members,
      invitations
    })

  } catch (error) {
    console.error('Failed to get organization:', error)
    return NextResponse.json({ error: 'Failed to get organization' }, { status: 500 })
  }
}
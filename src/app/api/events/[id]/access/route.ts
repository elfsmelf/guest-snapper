import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-session-helpers'
import { canUserAccessEvent } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ hasAccess: false })
    }
    
    const hasAccess = await canUserAccessEvent(eventId, session.user.id)
    
    return NextResponse.json({ hasAccess })
  } catch (error) {
    console.error('Error checking event access:', error)
    return NextResponse.json({ hasAccess: false }, { status: 500 })
  }
}
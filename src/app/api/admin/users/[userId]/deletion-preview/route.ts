import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { UserDeletionService } from '@/lib/user-deletion-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (by role or email fallback)
    const adminEmails = (process.env.ADMIN_EMAILS || 'support@guestsnapper.com').split(',').map(email => email.trim())
    const isAdminByRole = (session.user as any).role === 'admin'
    const isAdminByEmail = adminEmails.includes(session.user.email)
    
    if (!isAdminByRole && !isAdminByEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent admin from previewing deletion of themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const deletionService = new UserDeletionService()
    const preview = await deletionService.previewDeletion(userId)

    return NextResponse.json({
      success: true,
      preview
    })

  } catch (error: any) {
    console.error('Error generating deletion preview:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate deletion preview', 
      details: error.message 
    }, { status: 500 })
  }
}
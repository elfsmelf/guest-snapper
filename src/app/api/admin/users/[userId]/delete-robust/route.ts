import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { UserDeletionService } from '@/lib/user-deletion-service'

export async function DELETE(
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

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Parse confirmation from request body
    const body = await request.json().catch(() => ({}))
    if (!body.confirmed) {
      return NextResponse.json({ 
        error: 'Deletion must be confirmed', 
        message: 'Please confirm the deletion by setting confirmed: true in the request body' 
      }, { status: 400 })
    }

    console.log(`🗑️ Starting robust deletion of user: ${userId} by admin: ${session.user.email}`)

    const deletionService = new UserDeletionService()
    const result = await deletionService.deleteUser(userId)

    console.log(`✅ User deletion completed successfully:`, {
      deletedUser: result.deletedUser.email,
      summary: result.summary,
      errors: result.errors
    })

    return NextResponse.json({
      success: true,
      message: `User ${result.deletedUser.email} has been permanently deleted`,
      result
    })

  } catch (error: any) {
    console.error('Error during robust user deletion:', error)
    
    if (error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'User deletion failed', 
      details: error.message 
    }, { status: 500 })
  }
}
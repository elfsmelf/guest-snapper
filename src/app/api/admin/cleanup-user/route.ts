import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/database/db'
import { users, sessions, accounts, verifications, members, invitations, events, albums, uploads } from '@/database/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || 'support@guestsnapper.com').split(',').map(email => email.trim())
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email } = await request.json()
    const targetEmail = email || 'elfsmelf@gmail.com'

    console.log(`🧹 Starting cleanup for user: ${targetEmail}`)
    
    const cleanupResults = []
    
    // First, find any user records with this email
    const existingUsers = await db.select().from(users).where(eq(users.email, targetEmail))
    cleanupResults.push(`📧 Found ${existingUsers.length} user records with email: ${targetEmail}`)
    
    for (const user of existingUsers) {
      cleanupResults.push(`🔍 Processing user ID: ${user.id}`)
      
      // Get user's events for reporting
      const userEvents = await db.select().from(events).where(eq(events.userId, user.id))
      cleanupResults.push(`📅 Found ${userEvents.length} events for this user`)
      
      // Use Better Auth's built-in admin removeUser method
      cleanupResults.push('🗑️  Using Better Auth admin removeUser method...')
      
      const deleteResult = await (auth.api as any).admin.removeUser({
        headers: await headers(),
        body: { userId: user.id }
      })

      if (deleteResult?.error) {
        throw new Error(deleteResult.error.message || 'Failed to delete user via Better Auth')
      }
      
      cleanupResults.push(`✅ Better Auth successfully removed user and all related data`)
      cleanupResults.push(`🎉 Successfully cleaned up user: ${user.id} (${targetEmail})`)
    }
    
    // Clean up any orphaned verification records for this email (just in case)
    cleanupResults.push('🧽 Cleaning up any remaining verification records...')
    await db.delete(verifications).where(eq(verifications.identifier, targetEmail))
    cleanupResults.push('✅ Cleaned up any remaining verification records')
    
    cleanupResults.push(`🎊 Cleanup complete! The email ${targetEmail} can now be used to create a new account.`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully cleaned up all traces of ${targetEmail}`,
      details: cleanupResults
    })

  } catch (error: any) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
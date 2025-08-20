import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/database/db'
import { users, sessions, accounts, verifications, members, invitations, events, albums, uploads } from '@/database/schema'
import { eq, like, sql } from 'drizzle-orm'

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

    console.log(`🔍 Deep cleanup for: ${targetEmail}`)
    
    const cleanupResults = []
    
    // Check all tables for any references to this email
    cleanupResults.push(`🔍 Performing deep scan for: ${targetEmail}`)
    
    // 1. Check users table
    const usersFound = await db.select().from(users).where(eq(users.email, targetEmail))
    cleanupResults.push(`👤 Users table: ${usersFound.length} records`)
    
    // 2. Check verifications table (by identifier)
    const verificationsFound = await db.select().from(verifications).where(eq(verifications.identifier, targetEmail))
    cleanupResults.push(`📧 Verifications table: ${verificationsFound.length} records`)
    
    // 3. Check invitations table (by email)
    const invitationsFound = await db.select().from(invitations).where(eq(invitations.email, targetEmail))
    cleanupResults.push(`📨 Invitations table: ${invitationsFound.length} records`)
    
    // 4. Check accounts table for any account linked to users with this email
    let accountsFound = []
    if (usersFound.length > 0) {
      for (const user of usersFound) {
        const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, user.id))
        accountsFound.push(...userAccounts)
      }
    }
    cleanupResults.push(`🔗 Accounts table: ${accountsFound.length} records`)
    
    // 5. Check sessions table
    let sessionsFound = []
    if (usersFound.length > 0) {
      for (const user of usersFound) {
        const userSessions = await db.select().from(sessions).where(eq(sessions.userId, user.id))
        sessionsFound.push(...userSessions)
      }
    }
    cleanupResults.push(`🔐 Sessions table: ${sessionsFound.length} records`)
    
    // 6. Check members table
    let membersFound = []
    if (usersFound.length > 0) {
      for (const user of usersFound) {
        const userMembers = await db.select().from(members).where(eq(members.userId, user.id))
        membersFound.push(...userMembers)
      }
    }
    cleanupResults.push(`👥 Members table: ${membersFound.length} records`)
    
    // Now perform aggressive cleanup
    cleanupResults.push(`🧹 Starting aggressive cleanup...`)
    
    try {
      // Delete all verifications for this email (including any variations)
      const deletedVerifications = await db.delete(verifications).where(eq(verifications.identifier, targetEmail))
      cleanupResults.push(`✅ Deleted verifications`)
      
      // Delete all invitations for this email
      const deletedInvitations = await db.delete(invitations).where(eq(invitations.email, targetEmail))
      cleanupResults.push(`✅ Deleted invitations`)
      
      // If users exist, clean them up through Better Auth
      for (const user of usersFound) {
        cleanupResults.push(`🗑️ Removing user via Better Auth: ${user.id}`)
        
        try {
          const deleteResult = await (auth.api as any).admin.removeUser({
            headers: await headers(),
            body: { userId: user.id }
          })
          
          if (deleteResult?.error) {
            cleanupResults.push(`⚠️ Better Auth error: ${deleteResult.error.message}`)
            // Fallback to manual deletion
            await db.delete(members).where(eq(members.userId, user.id))
            await db.delete(accounts).where(eq(accounts.userId, user.id))
            await db.delete(sessions).where(eq(sessions.userId, user.id))
            await db.delete(users).where(eq(users.id, user.id))
            cleanupResults.push(`✅ Manual cleanup completed for user ${user.id}`)
          } else {
            cleanupResults.push(`✅ Better Auth removal successful for user ${user.id}`)
          }
        } catch (authError: any) {
          cleanupResults.push(`⚠️ Better Auth failed: ${authError.message}`)
          // Manual cleanup as fallback
          await db.delete(members).where(eq(members.userId, user.id))
          await db.delete(accounts).where(eq(accounts.userId, user.id))
          await db.delete(sessions).where(eq(sessions.userId, user.id))
          await db.delete(users).where(eq(users.id, user.id))
          cleanupResults.push(`✅ Manual cleanup completed for user ${user.id}`)
        }
      }
      
      // Final verification cleanup (catch any stragglers)
      await db.delete(verifications).where(eq(verifications.identifier, targetEmail))
      cleanupResults.push(`✅ Final verification cleanup`)
      
      // Check for any database constraints or triggers that might be preventing user creation
      cleanupResults.push(`🔍 Final verification scan...`)
      
      const finalUsersCheck = await db.select().from(users).where(eq(users.email, targetEmail))
      const finalVerificationsCheck = await db.select().from(verifications).where(eq(verifications.identifier, targetEmail))
      const finalInvitationsCheck = await db.select().from(invitations).where(eq(invitations.email, targetEmail))
      
      cleanupResults.push(`📊 Final counts - Users: ${finalUsersCheck.length}, Verifications: ${finalVerificationsCheck.length}, Invitations: ${finalInvitationsCheck.length}`)
      
      if (finalUsersCheck.length === 0 && finalVerificationsCheck.length === 0 && finalInvitationsCheck.length === 0) {
        cleanupResults.push(`🎉 Deep cleanup successful! Email ${targetEmail} should now be available.`)
      } else {
        cleanupResults.push(`⚠️ Some records still remain. There may be database constraints or triggers preventing cleanup.`)
      }
      
    } catch (cleanupError: any) {
      cleanupResults.push(`❌ Cleanup error: ${cleanupError.message}`)
      throw cleanupError
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Deep cleanup completed for ${targetEmail}`,
      details: cleanupResults
    })

  } catch (error: any) {
    console.error('❌ Error during deep cleanup:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
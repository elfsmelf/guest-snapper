import { db } from './src/database/db'
import { users, sessions, accounts, verifications, members, invitations, events, albums, uploads } from './src/database/schema'
import { eq } from 'drizzle-orm'

const targetEmail = 'elfsmelf@gmail.com'

async function cleanupUser() {
  console.log(`🧹 Starting cleanup for user: ${targetEmail}`)
  
  try {
    // First, find any user records with this email
    const existingUsers = await db.select().from(users).where(eq(users.email, targetEmail))
    console.log(`📧 Found ${existingUsers.length} user records with email: ${targetEmail}`)
    
    for (const user of existingUsers) {
      console.log(`🔍 Processing user ID: ${user.id}`)
      
      // Get user's events for reporting
      const userEvents = await db.select().from(events).where(eq(events.userId, user.id))
      console.log(`📅 Found ${userEvents.length} events for this user`)
      
      // Clean up Better Auth related data
      console.log('🗑️  Cleaning up Better Auth data...')
      
      // Delete verifications for this email
      await db.delete(verifications).where(eq(verifications.identifier, targetEmail))
      console.log(`✅ Deleted verification records`)
      
      // Delete invitations where this user was the inviter
      await db.delete(invitations).where(eq(invitations.inviterId, user.id))
      console.log(`✅ Deleted invitation records`)
      
      // Delete organization memberships
      await db.delete(members).where(eq(members.userId, user.id))
      console.log(`✅ Deleted organization memberships`)
      
      // Delete user accounts (OAuth connections)
      await db.delete(accounts).where(eq(accounts.userId, user.id))
      console.log(`✅ Deleted OAuth account connections`)
      
      // Delete active sessions
      await db.delete(sessions).where(eq(sessions.userId, user.id))
      console.log(`✅ Deleted user sessions`)
      
      // Delete the user (this will cascade delete events, albums, uploads)
      await db.delete(users).where(eq(users.id, user.id))
      console.log(`✅ Deleted user record`)
      
      console.log(`🎉 Successfully cleaned up user: ${user.id} (${targetEmail})`)
    }
    
    // Also clean up any orphaned verification records for this email
    console.log('🧽 Cleaning up any remaining verification records...')
    await db.delete(verifications).where(eq(verifications.identifier, targetEmail))
    console.log('✅ Cleaned up any remaining verification records')
    
    console.log(`\n🎊 Cleanup complete! The email ${targetEmail} can now be used to create a new account.`)
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Run the cleanup
cleanupUser().catch(console.error)
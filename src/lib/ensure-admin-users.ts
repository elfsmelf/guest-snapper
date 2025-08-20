import { db } from '@/database/db'
import { users } from '@/database/schema'
import { eq, inArray } from 'drizzle-orm'

/**
 * Ensures that users listed in ADMIN_EMAILS environment variable have admin role
 * This runs automatically to keep admin roles in sync with environment configuration
 */
export async function ensureAdminUsers() {
  try {
    // Get admin emails from environment
    const adminEmailsEnv = process.env.ADMIN_EMAILS || 'support@guestsnapper.com'
    const adminEmails = adminEmailsEnv.split(',').map(email => email.trim()).filter(Boolean)
    
    if (adminEmails.length === 0) {
      console.log('🔧 No admin emails configured, skipping admin role setup')
      return
    }
    
    console.log(`🔧 Checking admin roles for: ${adminEmails.join(', ')}`)
    
    // Find users with these emails
    const existingUsers = await db.select()
      .from(users)
      .where(inArray(users.email, adminEmails))
    
    if (existingUsers.length === 0) {
      console.log('ℹ️ No admin users found in database yet - they will be set as admin when they sign up')
      return
    }
    
    // Check which users need admin role
    const usersNeedingAdminRole = existingUsers.filter(user => user.role !== 'admin')
    
    if (usersNeedingAdminRole.length === 0) {
      console.log('✅ All admin emails already have admin role')
      return
    }
    
    // Update users to have admin role
    for (const user of usersNeedingAdminRole) {
      await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, user.id))
      
      console.log(`✅ Set admin role for: ${user.email}`)
    }
    
    console.log(`🎉 Admin role setup complete for ${usersNeedingAdminRole.length} user(s)`)
    
  } catch (error) {
    console.error('❌ Error ensuring admin users:', error)
    // Don't throw - we don't want to break the app if this fails
  }
}

/**
 * Hook to automatically set admin role when admin users sign up
 * Call this after user creation/update in auth callbacks
 */
export async function checkAndSetAdminRole(userEmail: string, userId: string) {
  try {
    const adminEmailsEnv = process.env.ADMIN_EMAILS || 'support@guestsnapper.com'
    const adminEmails = adminEmailsEnv.split(',').map(email => email.trim())
    
    if (adminEmails.includes(userEmail)) {
      // Check if user already has admin role
      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      
      if (user.length > 0 && user[0].role !== 'admin') {
        await db.update(users)
          .set({ role: 'admin' })
          .where(eq(users.id, userId))
        
        console.log(`🔧 Auto-assigned admin role to: ${userEmail}`)
      }
    }
  } catch (error) {
    console.error('❌ Error checking admin role:', error)
    // Don't throw - we don't want to break auth flow
  }
}
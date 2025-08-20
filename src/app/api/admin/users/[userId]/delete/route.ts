import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/database/db'
import { users, events, albums, uploads, sessions, accounts, verifications, members, invitations } from '@/database/schema'
import { eq, or } from 'drizzle-orm'

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

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || 'support@guestsnapper.com').split(',').map(email => email.trim())
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Get user to verify it exists
    const userToDelete = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (userToDelete.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all events for this user
    const userEvents = await db.select().from(events).where(eq(events.userId, userId))

    // Get all uploads for cleanup from R2 (including uploads that might not be linked to events)
    const uploadsToDelete = await db
      .select({ 
        fileUrl: uploads.fileUrl,
        fileName: uploads.fileName,
        id: uploads.id
      })
      .from(uploads)
      .innerJoin(events, eq(uploads.eventId, events.id))
      .where(eq(events.userId, userId))

    // Delete from R2 storage if R2 is configured
    if (uploadsToDelete.length > 0 && process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME) {
      try {
        const { S3Client, DeleteObjectsCommand } = await import('@aws-sdk/client-s3')
        
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: process.env.R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
        })

        // Extract file keys from URLs
        const keysToDelete = []
        for (const upload of uploadsToDelete) {
          if (upload.fileUrl) {
            try {
              // Extract the key from the file URL
              // Assuming the URL format is like: https://bucket.r2.dev/key or similar
              const url = new URL(upload.fileUrl)
              const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
              if (key) {
                keysToDelete.push({ Key: key })
              }
            } catch (urlError) {
              console.error('Error parsing file URL:', upload.fileUrl, urlError)
            }
          }
        }

        if (keysToDelete.length > 0) {
          // Delete in batches of 1000 (S3 limit)
          const batchSize = 1000
          for (let i = 0; i < keysToDelete.length; i += batchSize) {
            const batch = keysToDelete.slice(i, i + batchSize)
            try {
              await s3Client.send(new DeleteObjectsCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Delete: {
                  Objects: batch,
                  Quiet: true,
                },
              }))
            } catch (r2Error) {
              console.error('Error deleting from R2:', r2Error)
              // Continue with database deletion even if R2 deletion fails
            }
          }
        }
      } catch (r2SetupError) {
        console.error('Error setting up R2 client:', r2SetupError)
        // Continue with database deletion even if R2 setup fails
      }
    }

    // Try to use Better Auth's built-in admin removeUser method
    let deletedViaAuth = false
    try {
      const deleteResult = await (auth.api as any).adminRemoveUser({
        headers: await headers(),
        body: { userId }
      })

      if (deleteResult?.error) {
        console.warn('Better Auth deletion failed, falling back to manual deletion:', deleteResult.error)
      } else {
        deletedViaAuth = true
        console.log('✅ User deleted successfully via Better Auth')
      }
    } catch (authError: any) {
      console.warn('Better Auth deletion error, falling back to manual deletion:', authError.message)
    }

    // Fallback to manual deletion if Better Auth failed
    if (!deletedViaAuth) {
      console.log('🔧 Performing manual deletion...')
      
      // Delete Better Auth related data manually
      await db.delete(verifications).where(eq(verifications.identifier, userToDelete[0].email))
      await db.delete(invitations).where(eq(invitations.inviterId, userId))
      await db.delete(members).where(eq(members.userId, userId))
      await db.delete(accounts).where(eq(accounts.userId, userId))
      await db.delete(sessions).where(eq(sessions.userId, userId))
      
      // Delete the user (this will cascade delete events, albums, uploads due to foreign keys)
      await db.delete(users).where(eq(users.id, userId))
      
      console.log('✅ Manual deletion completed')
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${userToDelete[0].email} and all associated data deleted successfully`,
      deletedEvents: userEvents.length,
      deletedFiles: uploadsToDelete.length
    })

  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { db } from '@/database/db'
import { users, events, albums, uploads, sessions, accounts, verifications, members, invitations, guestbookEntries } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export interface DeletionPreview {
  user: {
    id: string
    email: string
    name: string
    createdAt: string
  }
  events: {
    count: number
    list: Array<{
      id: string
      name: string
      coupleNames: string
      createdAt: string
    }>
  }
  uploads: {
    count: number
    totalSizeBytes: number
    r2FilesToDelete: string[]
  }
  albums: {
    count: number
  }
  guestbookEntries: {
    count: number
  }
  betterAuthData: {
    sessions: number
    accounts: number
    verifications: number
    memberships: number
    invitations: number
  }
}

export interface DeletionResult {
  success: boolean
  deletedUser: {
    id: string
    email: string
  }
  summary: {
    eventsDeleted: number
    uploadsDeleted: number
    albumsDeleted: number
    guestbookEntriesDeleted: number
    r2FilesDeleted: number
    sessionsRevoked: number
    accountsDeleted: number
    verificationsDeleted: number
    membershipsDeleted: number
    invitationsDeleted: number
  }
  errors?: string[]
}

export class UserDeletionService {
  /**
   * Preview what will be deleted for a user without actually deleting anything
   */
  async previewDeletion(userId: string): Promise<DeletionPreview> {
    // Get user info
    const userInfo = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, userId)).limit(1)

    if (userInfo.length === 0) {
      throw new Error('User not found')
    }

    // Get user's events
    const userEvents = await db.select({
      id: events.id,
      name: events.name,
      coupleNames: events.coupleNames,
      createdAt: events.createdAt
    }).from(events).where(eq(events.userId, userId))

    // Get uploads for R2 cleanup
    const userUploads = await db.select({
      id: uploads.id,
      fileName: uploads.fileName,
      fileUrl: uploads.fileUrl,
      fileSize: uploads.fileSize
    }).from(uploads)
      .innerJoin(events, eq(uploads.eventId, events.id))
      .where(eq(events.userId, userId))

    // Get albums count
    const userAlbums = await db.select({ id: albums.id })
      .from(albums)
      .innerJoin(events, eq(albums.eventId, events.id))
      .where(eq(events.userId, userId))

    // Get guestbook entries count
    const userGuestbookEntries = await db.select({ id: guestbookEntries.id })
      .from(guestbookEntries)
      .innerJoin(events, eq(guestbookEntries.eventId, events.id))
      .where(eq(events.userId, userId))

    // Get Better Auth related data counts
    const [userSessions, userAccounts, userVerifications, userMemberships, userInvitations] = await Promise.all([
      db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId)),
      db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, userId)),
      db.select({ id: verifications.id }).from(verifications).where(eq(verifications.identifier, userInfo[0].email)),
      db.select({ id: members.id }).from(members).where(eq(members.userId, userId)),
      db.select({ id: invitations.id }).from(invitations).where(eq(invitations.inviterId, userId))
    ])

    // Extract R2 file keys from URLs
    const r2FilesToDelete: string[] = []
    const totalSizeBytes = userUploads.reduce((total, upload) => {
      // Extract R2 key from file URL
      if (upload.fileUrl) {
        try {
          const url = new URL(upload.fileUrl)
          const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
          if (key) {
            r2FilesToDelete.push(key)
          }
        } catch (error) {
          console.warn('Could not parse file URL:', upload.fileUrl)
        }
      }
      return total + (upload.fileSize || 0)
    }, 0)

    return {
      user: {
        id: userInfo[0].id,
        email: userInfo[0].email,
        name: userInfo[0].name || 'No name',
        createdAt: userInfo[0].createdAt?.toISOString() || new Date().toISOString()
      },
      events: {
        count: userEvents.length,
        list: userEvents.map(event => ({
          id: event.id,
          name: event.name,
          coupleNames: event.coupleNames,
          createdAt: event.createdAt
        }))
      },
      uploads: {
        count: userUploads.length,
        totalSizeBytes,
        r2FilesToDelete
      },
      albums: {
        count: userAlbums.length
      },
      guestbookEntries: {
        count: userGuestbookEntries.length
      },
      betterAuthData: {
        sessions: userSessions.length,
        accounts: userAccounts.length,
        verifications: userVerifications.length,
        memberships: userMemberships.length,
        invitations: userInvitations.length
      }
    }
  }

  /**
   * Perform the actual user deletion with comprehensive cleanup
   */
  async deleteUser(userId: string): Promise<DeletionResult> {
    const errors: string[] = []
    let deletedUser: { id: string, email: string } | null = null
    
    // Get user info before deletion
    const userInfo = await db.select({
      id: users.id,
      email: users.email
    }).from(users).where(eq(users.id, userId)).limit(1)

    if (userInfo.length === 0) {
      throw new Error('User not found')
    }

    deletedUser = userInfo[0]

    // Get deletion preview for counts
    const preview = await this.previewDeletion(userId)

    try {
      // Step 1: Note that we'll delete sessions in the database transaction
      // Better Auth sessions will be invalid once we delete them from the database
      console.log('🗃️ Sessions will be cleaned up in database transaction')

      // Start database transaction
      const result = await db.transaction(async (tx) => {
        // Step 2: Delete R2 files first (before database cleanup)
        let r2FilesDeleted = 0
        if (preview.uploads.r2FilesToDelete.length > 0) {
          try {
            r2FilesDeleted = await this.deleteR2Files(preview.uploads.r2FilesToDelete)
          } catch (r2Error: any) {
            errors.push(`R2 cleanup failed: ${r2Error.message}`)
            // Continue with database deletion even if R2 fails
          }
        }

        // Step 3: Delete in dependency order using transaction
        // Delete guestbook entries
        await tx.delete(guestbookEntries)
          .where(eq(guestbookEntries.eventId, 
            tx.select({ id: events.id }).from(events).where(eq(events.userId, userId))
          ))

        // Delete uploads
        await tx.delete(uploads)
          .where(eq(uploads.eventId, 
            tx.select({ id: events.id }).from(events).where(eq(events.userId, userId))
          ))

        // Delete albums
        await tx.delete(albums)
          .where(eq(albums.eventId, 
            tx.select({ id: events.id }).from(events).where(eq(events.userId, userId))
          ))

        // Delete events
        await tx.delete(events).where(eq(events.userId, userId))

        // Delete Better Auth related data
        await tx.delete(verifications).where(eq(verifications.identifier, deletedUser!.email))
        await tx.delete(invitations).where(eq(invitations.inviterId, userId))
        await tx.delete(members).where(eq(members.userId, userId))
        await tx.delete(accounts).where(eq(accounts.userId, userId))
        await tx.delete(sessions).where(eq(sessions.userId, userId))

        // Finally delete the user
        await tx.delete(users).where(eq(users.id, userId))

        return { r2FilesDeleted }
      })

      console.log(`✅ User ${deletedUser!.email} deletion completed successfully`)

      return {
        success: true,
        deletedUser: deletedUser!,
        summary: {
          eventsDeleted: preview.events.count,
          uploadsDeleted: preview.uploads.count,
          albumsDeleted: preview.albums.count,
          guestbookEntriesDeleted: preview.guestbookEntries.count,
          r2FilesDeleted: result.r2FilesDeleted,
          sessionsRevoked: preview.betterAuthData.sessions,
          accountsDeleted: preview.betterAuthData.accounts,
          verificationsDeleted: preview.betterAuthData.verifications,
          membershipsDeleted: preview.betterAuthData.memberships,
          invitationsDeleted: preview.betterAuthData.invitations
        },
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error: any) {
      console.error('User deletion failed:', error)
      throw new Error(`User deletion failed: ${error.message}`)
    }
  }

  /**
   * Delete files from R2 storage
   */
  private async deleteR2Files(fileKeys: string[]): Promise<number> {
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      console.warn('R2 not configured, skipping file deletion')
      return 0
    }

    const { S3Client, DeleteObjectsCommand } = await import('@aws-sdk/client-s3')
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })

    let totalDeleted = 0
    const batchSize = 1000 // S3 limit

    for (let i = 0; i < fileKeys.length; i += batchSize) {
      const batch = fileKeys.slice(i, i + batchSize)
      const objectsToDelete = batch.map(key => ({ Key: key }))

      try {
        const result = await s3Client.send(new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Delete: {
            Objects: objectsToDelete,
            Quiet: true,
          },
        }))

        totalDeleted += objectsToDelete.length
        console.log(`Deleted batch of ${objectsToDelete.length} files from R2`)
      } catch (batchError) {
        console.error('Failed to delete batch from R2:', batchError)
        throw batchError
      }
    }

    return totalDeleted
  }
}
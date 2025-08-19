import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/database/db'
import { uploads, events } from '@/database/schema'
import { eq, and } from 'drizzle-orm'
import { canUserAccessEvent } from '@/lib/auth-helpers'
import { r2Client, bucketName } from '@/lib/r2/client'
import archiver from 'archiver'
import { GetObjectCommand } from '@aws-sdk/client-s3'

// Helper function to convert Node.js stream to Web ReadableStream
function nodeStreamToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => {
        controller.enqueue(new Uint8Array(chunk))
      })
      
      nodeStream.on('end', () => {
        controller.close()
      })
      
      nodeStream.on('error', (err) => {
        controller.error(err)
      })
    }
  })
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

    // Verify the user can access this event (owner or organization member)
    const hasAccess = await canUserAccessEvent(eventId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Not authorized to download files from this event' }, { status: 403 })
    }

    // Get event details for filename
    const eventResult = await db
      .select({
        coupleNames: events.coupleNames,
        eventDate: events.eventDate
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventResult.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = eventResult[0]

    // Get all approved uploads for this event
    const uploadsResult = await db
      .select({
        id: uploads.id,
        fileName: uploads.fileName,
        fileUrl: uploads.fileUrl,
        fileType: uploads.fileType,
        uploaderName: uploads.uploaderName,
      })
      .from(uploads)
      .where(and(eq(uploads.eventId, eventId), eq(uploads.isApproved, true)))
      .orderBy(uploads.createdAt)

    if (uploadsResult.length === 0) {
      return NextResponse.json({ error: 'No approved files found for this event' }, { status: 404 })
    }

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    // Convert archive stream to web stream
    const webStream = nodeStreamToWebStream(archive)

    // Set up response headers
    const eventDate = new Date(event.eventDate).toISOString().split('T')[0]
    const filename = `${event.coupleNames.replace(/[^a-zA-Z0-9\s-]/g, '')}-${eventDate}-photos.zip`
    
    const response = new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      }
    })

    // Process files asynchronously
    ;(async () => {
      try {
        let processedCount = 0
        
        for (const upload of uploadsResult) {
          try {
            // Extract R2 key from the file URL
            // Format: https://{publicDomain}/{fileKey} where fileKey is like "events/{eventId}/media/{filename}"
            const urlParts = new URL(upload.fileUrl)
            const key = urlParts.pathname.slice(1) // Remove leading slash to get the storage key
            
            console.log(`Processing file ${processedCount + 1}/${uploadsResult.length}: ${key}`)
            
            // Get object from R2
            const getObjectCommand = new GetObjectCommand({
              Bucket: bucketName,
              Key: key,
            })
            
            const s3Response = await r2Client.send(getObjectCommand)
            
            if (s3Response.Body) {
              // Create a safe filename for the archive
              const uploaderPrefix = upload.uploaderName ? `${upload.uploaderName.replace(/[^a-zA-Z0-9\s-]/g, '')}_` : ''
              const safeFileName = `${uploaderPrefix}${upload.fileName}`
              
              // Convert S3 stream to Buffer for archiver
              if (s3Response.Body) {
                try {
                  const chunks: Buffer[] = []
                  const stream = s3Response.Body as any
                  
                  // Handle different stream types
                  if (stream.transformToString) {
                    // AWS SDK v3 stream
                    const str = await stream.transformToString()
                    archive.append(str, { 
                      name: safeFileName,
                      date: new Date()
                    })
                  } else {
                    // Fallback for other stream types
                    archive.append(stream, { 
                      name: safeFileName,
                      date: new Date()
                    })
                  }
                } catch (error) {
                  console.error(`Failed to process file ${safeFileName}:`, error)
                }
              }
              
              processedCount++
              console.log(`Added file to archive: ${safeFileName}`)
            }
          } catch (fileError) {
            console.error(`Error processing file ${upload.fileName}:`, fileError)
            // Continue with other files even if one fails
          }
        }
        
        console.log(`Finalizing archive with ${processedCount} files`)
        
        // Finalize the archive
        archive.finalize()
        
      } catch (error) {
        console.error('Error creating archive:', error)
        archive.destroy()
      }
    })()

    return response

  } catch (error) {
    console.error('Download all files failed:', error)
    return NextResponse.json({ error: 'Failed to download files' }, { status: 500 })
  }
}
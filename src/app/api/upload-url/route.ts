import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2Client, bucketName, publicDomain } from "@/lib/r2/client"
import { db } from "@/database/db"
import { events } from "@/database/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // Allow public uploads for now
    
    const body = await request.json()
    const { eventId, fileName, fileType, fileSize } = body

    // File validation
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (fileSize > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/mov',
      'audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'
    ]
    
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Verify event exists and check access
    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventResult.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = eventResult[0]

    // For now, allow uploads if event exists and upload window is open
    // In production, implement proper access control
    const uploadWindowOpen = new Date(event.uploadWindowEnd) > new Date()
    const isOwner = session?.user?.id === event.userId

    if (!uploadWindowOpen && !isOwner) {
      return NextResponse.json({ error: 'Upload window closed' }, { status: 403 })
    }

    // Generate file key with organized structure
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    
    const fileKey = `events/${eventId}/media/${randomString}_${timestamp}.${fileExtension}`

    // Create presigned URL with metadata
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        'original-name': fileName.replace(/[^a-zA-Z0-9.-]/g, '_'),
        'event-id': eventId,
        'uploader-id': session?.user?.id || 'unknown',
        'upload-type': 'media',
        'file-size': fileSize.toString(),
        'upload-timestamp': timestamp.toString()
      }
    })

    const uploadUrl = await getSignedUrl(r2Client, putObjectCommand, { 
      expiresIn: 3600 
    })

    const fileUrl = `https://${publicDomain}/${fileKey}`

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileKey,
      fileUrl,
      expiresIn: 3600
    })

  } catch (error) {
    console.error('Upload URL generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
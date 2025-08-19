import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { validateEventAccess } from '@/lib/auth-helpers'
import { r2Client, bucketName, publicDomain } from '@/lib/r2/client'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId, fileName, fileType, fileSize } = await request.json()

    // Validate input
    if (!eventId || !fileName || !fileType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file type
    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Verify the user can access this event (owner or organization member)
    try {
      await validateEventAccess(eventId, session.user.id)
    } catch (error) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    // Generate unique file key
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    const fileKey = `events/${eventId}/cover/${randomString}_${timestamp}.${fileExtension}`

    // Create presigned URL
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        'original-name': fileName,
        'event-id': eventId,
        'uploader-id': session.user.id,
        'upload-type': 'cover-image'
      }
    })

    const uploadUrl = await getSignedUrl(r2Client, putObjectCommand, { 
      expiresIn: 3600 // 1 hour
    })

    const fileUrl = `https://${publicDomain}/${fileKey}`

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileKey,
      fileUrl
    })

  } catch (error) {
    console.error('Cover image upload URL generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { r2Client, bucketName } from '@/lib/r2/client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function DELETE(request: NextRequest) {
  try {
    // Authentication check - only admins can delete marketing content
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = (session.user as any).role === 'admin' || session.user.email === process.env.ADMIN_EMAIL

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({
        error: 'Missing required field: key'
      }, { status: 400 })
    }

    // Validate that the key is actually a marketing asset
    if (!key.startsWith('marketing/')) {
      return NextResponse.json({
        error: 'Invalid key: only marketing assets can be deleted through this endpoint'
      }, { status: 400 })
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    })

    await r2Client.send(deleteCommand)

    return NextResponse.json({
      success: true,
      deletedKey: key
    })

  } catch (error) {
    console.error('Failed to delete marketing content:', error)
    return NextResponse.json({
      error: 'Failed to delete marketing content'
    }, { status: 500 })
  }
}
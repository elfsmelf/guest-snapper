import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { r2Client, bucketName, getMarketingImageUrl, MARKETING_CATEGORIES } from '@/lib/r2/client'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'

export async function GET(request: NextRequest) {
  try {
    // Authentication check - only admins can view marketing content
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // If category is specified, filter by that category
    const prefix = category ? `marketing/${category}/` : 'marketing/'

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 1000 // Adjust as needed
    })

    const response = await r2Client.send(listCommand)

    const objects = response.Contents || []

    // Organize objects by category
    const organizedContent = objects.reduce((acc, obj) => {
      if (!obj.Key) return acc

      // Extract category from key: marketing/{category}/{filename}
      const keyParts = obj.Key.split('/')
      if (keyParts.length < 3) return acc

      const objCategory = keyParts[1]
      const fileName = keyParts[2]

      if (!acc[objCategory]) {
        acc[objCategory] = []
      }

      acc[objCategory].push({
        key: obj.Key,
        fileName,
        url: getMarketingImageUrl(obj.Key),
        size: obj.Size || 0,
        lastModified: obj.LastModified?.toISOString() || null,
        category: objCategory
      })

      return acc
    }, {} as Record<string, Array<{
      key: string
      fileName: string
      url: string
      size: number
      lastModified: string | null
      category: string
    }>>)

    // Sort each category by last modified date (newest first)
    Object.keys(organizedContent).forEach(cat => {
      organizedContent[cat].sort((a, b) => {
        if (!a.lastModified || !b.lastModified) return 0
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      })
    })

    return NextResponse.json({
      categories: Object.values(MARKETING_CATEGORIES),
      content: organizedContent,
      totalObjects: objects.length
    })

  } catch (error) {
    console.error('Failed to list marketing content:', error)
    return NextResponse.json({
      error: 'Failed to list marketing content'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { signMarketingUploadUrl, MARKETING_CATEGORIES, type MarketingCategory } from '@/lib/r2/client'

export async function POST(request: NextRequest) {
  try {
    // Authentication check - only admins can upload marketing content
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you may need to adjust this based on your admin logic)
    const isAdmin = (session.user as any).role === 'admin' || session.user.email === process.env.ADMIN_EMAIL

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { fileName, contentType, category } = await request.json()

    if (!fileName || !contentType || !category) {
      return NextResponse.json({
        error: 'Missing required fields: fileName, contentType, category'
      }, { status: 400 })
    }

    // Validate category
    const validCategories = Object.values(MARKETING_CATEGORIES)
    if (!validCategories.includes(category as MarketingCategory)) {
      return NextResponse.json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      }, { status: 400 })
    }

    // Validate file type (images only for marketing)
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({
        error: 'Only image files are allowed for marketing content'
      }, { status: 400 })
    }

    // Generate presigned URL for marketing content
    const { url, key } = await signMarketingUploadUrl(category, fileName, contentType)

    return NextResponse.json({
      uploadUrl: url,
      key,
      category,
      fileName
    })

  } catch (error) {
    console.error('Failed to generate marketing upload URL:', error)
    return NextResponse.json({
      error: 'Failed to generate upload URL'
    }, { status: 500 })
  }
}
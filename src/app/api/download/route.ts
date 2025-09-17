import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileUrl = searchParams.get('url')
    const fileName = searchParams.get('filename')

    if (!fileUrl || !fileName) {
      return new Response('Missing url or filename parameter', { status: 400 })
    }

    // Fetch the file from the external URL (Cloudflare R2)
    const response = await fetch(fileUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`)
    }

    const blob = await response.blob()

    // Return the file with proper download headers
    return new Response(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Download proxy error:', error)
    return new Response('Download failed', { status: 500 })
  }
}
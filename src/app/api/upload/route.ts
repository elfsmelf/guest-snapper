import { NextRequest, NextResponse } from "next/server"
import { createUpload } from "@/app/actions/upload"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      eventId, 
      albumId, 
      uploaderName, 
      caption, 
      fileName, 
      fileSize, 
      fileType, 
      fileUrl,
      mimeType
    } = body

    const result = await createUpload({
      eventId,
      albumId,
      uploaderName,
      caption,
      fileName,
      fileSize,
      fileType: fileType as 'image' | 'video' | 'audio',
      fileUrl,
      mimeType
    })

    if (result.success) {
      // Force ISR cache regeneration for the gallery page
      // This ensures uploaded photos appear immediately without waiting for cache expiry
      if (result.eventSlug) {
        revalidatePath(`/gallery/${result.eventSlug}`)
      }

      return NextResponse.json({
        success: true,
        upload: result.upload
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
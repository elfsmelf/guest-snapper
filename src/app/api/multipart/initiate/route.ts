import { NextRequest, NextResponse } from "next/server";
import { initiateMultipart, publicDomain } from "@/lib/r2/client";
import { db } from "@/database/db";
import { events } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    const body = await request.json();
    const { eventId, fileName, fileType, fileSize } = body;

    if (!eventId || !fileName || !fileType || !fileSize) {
      return NextResponse.json({ error: "eventId, fileName, fileType, and fileSize required" }, { status: 400 });
    }

    // File validation
    const maxSize = 500 * 1024 * 1024; // 500MB for multipart
    if (fileSize > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/mov',
      'audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'
    ];
    
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Verify event exists and check access
    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!eventResult.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventResult[0];
    const uploadWindowOpen = new Date(event.uploadWindowEnd) > new Date();
    const isOwner = session?.user?.id === event.userId;

    if (!uploadWindowOpen && !isOwner) {
      return NextResponse.json({ error: 'Upload window closed' }, { status: 403 });
    }

    // Generate file key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const fileKey = `events/${eventId}/media/${randomString}_${timestamp}.${fileExtension}`;

    // Determine optimal part size based on file size
    // R2 requires parts >= 5 MiB except the last part
    const MIN_PART_SIZE = 5 * 1024 * 1024; // 5 MiB
    let partSize: number;

    if (fileSize <= 100 * 1024 * 1024) { // <= 100MB
      partSize = Math.max(MIN_PART_SIZE, 8 * 1024 * 1024); // 8 MiB
    } else if (fileSize <= 1024 * 1024 * 1024) { // <= 1GB
      partSize = 16 * 1024 * 1024; // 16 MiB
    } else {
      partSize = 32 * 1024 * 1024; // 32 MiB
    }

    // Ensure we don't exceed 10,000 parts limit
    const maxParts = 10000;
    if (Math.ceil(fileSize / partSize) > maxParts) {
      partSize = Math.ceil(fileSize / maxParts);
      // Round up to nearest MB
      partSize = Math.ceil(partSize / (1024 * 1024)) * (1024 * 1024);
    }

    const partCount = Math.ceil(fileSize / partSize);

    // Create metadata for the upload
    const metadata = {
      'original-name': fileName.replace(/[^a-zA-Z0-9.-]/g, '_'),
      'event-id': eventId,
      'uploader-id': session?.user?.id || 'unknown',
      'upload-type': 'media',
      'file-size': fileSize.toString(),
      'upload-timestamp': timestamp.toString(),
      'part-size': partSize.toString(),
      'part-count': partCount.toString()
    };

    // Initiate multipart upload
    const { uploadId } = await initiateMultipart(fileKey, fileType, metadata);

    const fileUrl = `https://${publicDomain}/${fileKey}`;

    return NextResponse.json({
      success: true,
      uploadId,
      fileKey,
      fileUrl,
      partSize,
      partCount,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Multipart initiate failed:', error);
    return NextResponse.json({ error: 'Failed to initiate multipart upload' }, { status: 500 });
  }
}
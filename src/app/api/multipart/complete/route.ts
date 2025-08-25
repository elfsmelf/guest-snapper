import { NextRequest, NextResponse } from "next/server";
import { completeMultipart } from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileKey, uploadId, parts } = body;

    if (!fileKey || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json({ 
        error: "fileKey, uploadId, and parts array required" 
      }, { status: 400 });
    }

    // Validate parts format
    for (const part of parts) {
      if (!part.PartNumber || !part.ETag || 
          !Number.isInteger(part.PartNumber) || 
          typeof part.ETag !== 'string') {
        return NextResponse.json({
          error: "Each part must have PartNumber (integer) and ETag (string)"
        }, { status: 400 });
      }
    }

    // Complete the multipart upload
    const result = await completeMultipart(fileKey, uploadId, parts);

    return NextResponse.json({
      success: true,
      location: result.Location || null,
      etag: result.ETag || null,
      fileKey
    });

  } catch (error) {
    console.error('Failed to complete multipart upload:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('InvalidPart')) {
      return NextResponse.json({
        error: 'One or more parts are invalid. Please retry the upload.'
      }, { status: 400 });
    }
    
    if (errorMessage.includes('NoSuchUpload')) {
      return NextResponse.json({
        error: 'Multipart upload not found or expired. Please start a new upload.'
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: 'Failed to complete multipart upload',
      details: errorMessage
    }, { status: 500 });
  }
}
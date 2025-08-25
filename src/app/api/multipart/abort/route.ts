import { NextRequest, NextResponse } from "next/server";
import { abortMultipart } from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileKey, uploadId } = body;

    if (!fileKey || !uploadId) {
      return NextResponse.json({ 
        error: "fileKey and uploadId required" 
      }, { status: 400 });
    }

    // Abort the multipart upload
    await abortMultipart(fileKey, uploadId);

    return NextResponse.json({
      success: true,
      message: 'Multipart upload aborted successfully'
    });

  } catch (error) {
    console.error('Failed to abort multipart upload:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Don't treat "NoSuchUpload" as an error - the upload might already be completed/aborted
    if (errorMessage.includes('NoSuchUpload')) {
      return NextResponse.json({
        success: true,
        message: 'Upload not found (may already be completed or aborted)'
      });
    }

    return NextResponse.json({ 
      error: 'Failed to abort multipart upload',
      details: errorMessage
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { signPartUrl } from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileKey, uploadId, partNumbers } = body;

    if (!fileKey || !uploadId || !Array.isArray(partNumbers) || partNumbers.length === 0) {
      return NextResponse.json({ 
        error: "fileKey, uploadId, and partNumbers array required" 
      }, { status: 400 });
    }

    // Validate part numbers
    for (const partNumber of partNumbers) {
      if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
        return NextResponse.json({
          error: `Invalid part number: ${partNumber}. Must be integer between 1-10000`
        }, { status: 400 });
      }
    }

    // Generate presigned URLs for all requested parts
    const urls = await Promise.all(
      partNumbers.map(async (partNumber: number) => ({
        partNumber,
        url: await signPartUrl(fileKey, uploadId, partNumber, 3600), // 1 hour expiry
      }))
    );

    return NextResponse.json({
      success: true,
      urls
    });

  } catch (error) {
    console.error('Failed to generate part URLs:', error);
    return NextResponse.json({ 
      error: 'Failed to generate presigned part URLs' 
    }, { status: 500 });
  }
}
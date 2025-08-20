import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Starting R2 cleanup...')
    
    // Only proceed if R2 is configured
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      return NextResponse.json({ 
        success: true, 
        message: 'R2 not configured, skipping cleanup',
        action: 'skipped'
      })
    }
    
    const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3')
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
    
    // List all objects in the bucket
    console.log('📋 Listing all objects in R2 bucket...')
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
    })
    
    const listResult = await s3Client.send(listCommand)
    const objects = listResult.Contents || []
    
    if (objects.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'R2 bucket is already empty',
        deletedCount: 0
      })
    }
    
    console.log(`🗑️ Found ${objects.length} objects to delete`)
    
    // Delete all objects in batches of 1000 (S3 limit)
    const batchSize = 1000
    let totalDeleted = 0
    
    for (let i = 0; i < objects.length; i += batchSize) {
      const batch = objects.slice(i, i + batchSize)
      const deleteObjects = batch.map(obj => ({ Key: obj.Key! }))
      
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Delete: {
          Objects: deleteObjects,
          Quiet: true,
        },
      })
      
      await s3Client.send(deleteCommand)
      totalDeleted += deleteObjects.length
      console.log(`✅ Deleted batch of ${deleteObjects.length} objects`)
    }
    
    console.log(`🎉 R2 cleanup complete! Deleted ${totalDeleted} objects`)
    
    return NextResponse.json({ 
      success: true, 
      message: `R2 cleanup complete. Deleted ${totalDeleted} objects.`,
      deletedCount: totalDeleted
    })

  } catch (error: any) {
    console.error('❌ Error cleaning up R2:', error)
    return NextResponse.json({ 
      error: 'Failed to cleanup R2', 
      details: error.message 
    }, { status: 500 })
  }
}
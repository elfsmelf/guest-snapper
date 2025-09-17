/**
 * Script to create marketing folder structure in R2 bucket
 *
 * This script creates placeholder files in each marketing category folder
 * to establish the folder structure in your R2 bucket.
 *
 * After running this, you can upload marketing assets directly through
 * the Cloudflare R2 dashboard.
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
// Try to load environment variables from .env.local first, then .env
require('dotenv').config({ path: '.env.local' })
require('dotenv').config() // fallback to .env

// R2 Client Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
})

const bucketName = process.env.R2_BUCKET_NAME

// Marketing categories to create
const MARKETING_CATEGORIES = {
  heroes: 'Hero section images - main banner and landing page visuals',
  features: 'Feature showcase images - product feature highlights',
  testimonials: 'Customer testimonial images - customer photos and quotes',
  gallery: 'Sample gallery images - example wedding/event photos',
  logos: 'Brand logos and partners - company logos and partner badges',
  social: 'Social media graphics - posts, stories, and social content',
  email: 'Email marketing images - newsletter headers and email graphics',
  ads: 'Advertisement banners - promotional and advertising materials',
  misc: 'Miscellaneous marketing assets - other marketing materials'
}

async function createMarketingFolders() {
  console.log('🚀 Creating marketing folder structure in R2 bucket...')
  console.log(`📁 Bucket: ${bucketName}`)
  console.log('')

  const results = []

  for (const [category, description] of Object.entries(MARKETING_CATEGORIES)) {
    try {
      // Create a README file in each category folder
      const key = `marketing/${category}/README.txt`
      const content = `Marketing Category: ${category.toUpperCase()}

Description: ${description}

This folder is for storing ${category} related marketing assets.

Upload guidelines:
- Use descriptive filenames
- Optimize images for web (recommended: JPEG/PNG, <2MB)
- Include version numbers for updated assets (e.g., hero-v2.jpg)

Folder structure:
wedding-gallery-media/
├── events/           (user event content)
└── marketing/        (marketing assets)
    └── ${category}/  (this folder)

Created: ${new Date().toISOString()}
`

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: content,
        ContentType: 'text/plain',
        Metadata: {
          category: category,
          type: 'marketing',
          created: new Date().toISOString()
        }
      })

      await r2Client.send(command)

      console.log(`✅ Created: marketing/${category}/`)
      results.push({ category, status: 'success', key })

    } catch (error) {
      console.error(`❌ Failed to create marketing/${category}/`, error.message)
      results.push({ category, status: 'error', error: error.message })
    }
  }

  console.log('')
  console.log('📊 Summary:')
  console.log(`✅ Successfully created: ${results.filter(r => r.status === 'success').length} folders`)
  console.log(`❌ Failed: ${results.filter(r => r.status === 'error').length} folders`)

  if (results.some(r => r.status === 'error')) {
    console.log('')
    console.log('❌ Errors:')
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   - ${r.category}: ${r.error}`)
    })
  }

  console.log('')
  console.log('🎉 Marketing folder structure created!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('1. Go to your Cloudflare R2 dashboard')
  console.log('2. Navigate to your bucket:', bucketName)
  console.log('3. You should see a new "marketing/" folder with subfolders')
  console.log('4. Upload your marketing assets to the appropriate category folders')
  console.log('')
  console.log('📁 Available categories:')
  Object.entries(MARKETING_CATEGORIES).forEach(([category, description]) => {
    console.log(`   - marketing/${category}/ - ${description}`)
  })
}

// Run the script
async function main() {
  try {
    // Verify environment variables
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      console.error('❌ Missing required environment variables:')
      console.error('   - R2_ENDPOINT')
      console.error('   - R2_ACCESS_KEY_ID')
      console.error('   - R2_SECRET_ACCESS_KEY')
      console.error('   - R2_BUCKET_NAME')
      console.error('')
      console.error('Please check your .env file')
      process.exit(1)
    }

    await createMarketingFolders()
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

main()
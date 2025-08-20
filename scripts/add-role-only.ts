import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { sql } from "drizzle-orm"
import postgres from "postgres"

async function addRoleColumn() {
  // Create connection
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const connection = postgres(connectionString)
  const db = drizzle(connection)

  try {
    console.log('🔧 Adding role column to users table...')
    
    // Check if column exists first
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `)
    
    if (result.length === 0) {
      // Column doesn't exist, add it
      await db.execute(sql`ALTER TABLE "users" ADD COLUMN "role" text`)
      console.log('✅ Successfully added role column to users table')
    } else {
      console.log('ℹ️ Role column already exists in users table')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await connection.end()
  }
}

addRoleColumn()
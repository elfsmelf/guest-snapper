import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/database/db'
import { sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Starting fresh database reset...')
    
    // Drop all tables
    await db.execute(sql`DROP TABLE IF EXISTS uploads CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS albums CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS guestbook_entries CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS events CASCADE`)
    
    // Drop Better Auth tables
    await db.execute(sql`DROP TABLE IF EXISTS invitations CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS members CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS organizations CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS sessions CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS accounts CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS verifications CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`)
    
    // Drop any remaining tables
    await db.execute(sql`DROP TABLE IF EXISTS nodes CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS outbox CASCADE`)
    
    // Drop migration tracking to start fresh
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`)
    
    // Drop functions
    await db.execute(sql`DROP FUNCTION IF EXISTS public.outbox_notify() CASCADE`)
    
    console.log('✅ All tables dropped successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database reset complete. Run migrations to recreate schema.',
      nextSteps: [
        'Run: pnpm drizzle-kit push',
        'Or run: pnpm drizzle-kit migrate',
        'Then restart your app'
      ]
    })

  } catch (error: any) {
    console.error('❌ Error resetting database:', error)
    return NextResponse.json({ 
      error: 'Failed to reset database', 
      details: error.message 
    }, { status: 500 })
  }
}
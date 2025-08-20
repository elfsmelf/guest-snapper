import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/database/db'
import { sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || 'support@guestsnapper.com').split(',').map(email => email.trim())
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('🔧 Adding role column to users table...')
    
    try {
      // Check if role column exists
      const columnCheck = await db.execute(sql`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='role'
      `)
      
      if (columnCheck.rowCount === 0) {
        // Add the role column
        await db.execute(sql`ALTER TABLE "users" ADD COLUMN "role" text`)
        console.log('✅ Added role column to users table')
        
        return NextResponse.json({ 
          success: true, 
          message: 'Successfully added role column to users table',
          action: 'added'
        })
      } else {
        console.log('ℹ️ Role column already exists')
        
        return NextResponse.json({ 
          success: true, 
          message: 'Role column already exists in users table',
          action: 'exists'
        })
      }
      
    } catch (sqlError: any) {
      console.error('❌ SQL Error:', sqlError)
      return NextResponse.json({ 
        error: 'Failed to add role column', 
        details: sqlError.message 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Error adding role column:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
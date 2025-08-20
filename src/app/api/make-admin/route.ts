import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/database/db'
import { users } from '@/database/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const targetEmail = email || 'support@guestsnapper.com'
    
    console.log(`🔧 Making user admin: ${targetEmail}`)
    
    // Find the user by email
    const userToUpdate = await db.select().from(users).where(eq(users.email, targetEmail)).limit(1)
    
    if (userToUpdate.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Update the user's role to admin
    await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, targetEmail))
    
    console.log(`✅ Successfully set ${targetEmail} as admin`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully set ${targetEmail} as admin`,
      userId: userToUpdate[0].id
    })

  } catch (error: any) {
    console.error('❌ Error making user admin:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
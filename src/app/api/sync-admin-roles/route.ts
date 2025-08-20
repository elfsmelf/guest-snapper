import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminUsers } from '@/lib/ensure-admin-users'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manually syncing admin roles...')
    
    await ensureAdminUsers()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin roles synced successfully based on ADMIN_EMAILS environment variable'
    })

  } catch (error: any) {
    console.error('❌ Error syncing admin roles:', error)
    return NextResponse.json({ 
      error: 'Failed to sync admin roles', 
      details: error.message 
    }, { status: 500 })
  }
}
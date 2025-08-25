import { NextRequest, NextResponse } from "next/server"
import { initializeOnboarding } from "@/app/actions/onboarding"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params
    
    const result = await initializeOnboarding(eventId)
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        state: result.state 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error initializing onboarding:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to initialize onboarding' 
    }, { status: 500 })
  }
}
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const handlers = toNextJsHandler(auth)

// Add caching headers for GET requests (session checks)
export async function GET(req: NextRequest, context: any) {
  const response = await handlers.GET(req, context)
  
  // Add cache headers for session-related GET requests
  const url = new URL(req.url)
  if (url.pathname.includes('get-session')) {
    // Cache session responses for 5 minutes on CDN edge
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=30')
  } else if (url.pathname.includes('organization/list') || url.pathname.includes('organization/get-full')) {
    // Cache organization data for 10 minutes as it changes less frequently
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')
  }
  
  return response
}

export const POST = handlers.POST

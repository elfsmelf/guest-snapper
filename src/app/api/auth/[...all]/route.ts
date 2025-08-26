import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"
import { NextRequest } from "next/server"

const handlers = toNextJsHandler(auth)

// Handle GET requests with minimal caching for auth operations
export async function GET(req: NextRequest) {
  const response = await handlers.GET(req)
  
  // Add cache headers only for organization data (not session)
  const url = new URL(req.url)
  if (url.pathname.includes('organization/list') || url.pathname.includes('organization/get-full')) {
    // Cache organization data for 10 minutes as it changes less frequently
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')
  } else if (url.pathname.includes('get-session')) {
    // No caching for session endpoints to ensure immediate sign-out detection
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  return response
}

export const POST = handlers.POST

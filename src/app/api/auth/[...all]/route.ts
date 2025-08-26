import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"
import { NextRequest } from "next/server"

const handlers = toNextJsHandler(auth)

// Handle GET requests with optimized caching for auth operations
export async function GET(req: NextRequest) {
  const response = await handlers.GET(req)
  
  // Add cache headers based on endpoint type
  const url = new URL(req.url)
  if (url.pathname.includes('organization/list') || url.pathname.includes('organization/get-full')) {
    // Cache organization data aggressively (30 minutes) since membership changes are rare
    // Use stale-while-revalidate for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=300')
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=300')
  }
  // Let Better Auth's cookie cache handle session caching
  // No explicit cache headers for get-session endpoints
  
  return response
}

export const POST = handlers.POST

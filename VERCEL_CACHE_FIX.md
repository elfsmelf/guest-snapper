# Vercel Edge Caching Fix for Gallery Pages

## Problem Identified

Your gallery pages at `/gallery/[slug]` are not being cached at Vercel's Edge, causing every request to hit your Lambda functions. The CSV logs show the `vercelCache` column is empty for all requests, indicating no Edge caching is happening.

### Root Causes:

1. **No Edge cache headers**: The middleware doesn't set any cache control headers for public routes
2. **Dynamic session checks**: Using `getSession()` on every request makes Next.js treat the route as dynamic
3. **Cookie operations**: Setting guest tracking cookies prevents Edge caching
4. **Missing cache directives**: No `Vercel-CDN-Cache-Control` or `CDN-Cache-Control` headers

## Solution Overview

The fix involves setting proper Edge cache headers in middleware while being careful about cookie operations and authentication checks.

## Changes Made

### 1. Updated Middleware (`src/middleware.ts`)

Added cache headers for public gallery routes when users are not authenticated:

```typescript
// For unauthenticated users viewing galleries
if (!sessionCookie) {
    // Enable Edge caching for 10 minutes
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
    
    // Only set guest cookie if missing (setting cookies bypasses cache)
    if (!existingGuestId) {
        // Set cookie and disable caching for this response
        response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    }
}
```

### Key Points:
- **First visit**: Sets guest cookie, no caching (BYPASS)
- **Subsequent visits**: Has cookie, gets cached response (HIT)
- **Authenticated users**: No caching, shows personalized content

## How It Works

### Cache Flow for Public Users:

1. **First Request (No Cookie)**:
   - Middleware sets guest_id cookie
   - Response marked as `private, no-cache`
   - Vercel cache: BYPASS
   - Lambda executes

2. **Second Request (Has Cookie)**:
   - No cookie setting needed
   - Response gets cache headers: `s-maxage=600`
   - Vercel cache: MISS (first time for this edge location)
   - Lambda executes, response cached

3. **Third+ Requests (Within 10 min)**:
   - Response served from Edge cache
   - Vercel cache: HIT
   - No Lambda execution

### Cache Headers Explained:

- **`Vercel-CDN-Cache-Control`**: Vercel-specific, highest priority
- **`s-maxage=600`**: Cache at Edge for 600 seconds (10 minutes)
- **`stale-while-revalidate=60`**: Serve stale content for 60s while revalidating
- **`max-age=0`**: Browser always revalidates (ensures fresh data on refresh)

## Expected Results

After deployment, you should see in your logs:
- `x-vercel-cache: HIT` for repeated requests
- Reduced Lambda invocations
- Lower latency for users globally
- Significant cost savings

## Testing the Fix

1. **Deploy to Vercel**
2. **Clear browser cookies**
3. **Visit a gallery page** - First visit will be BYPASS
4. **Refresh the page** - Should see MISS then HIT
5. **Check response headers**:
   ```
   x-vercel-cache: HIT
   cache-control: public, max-age=0, must-revalidate
   ```

## Additional Optimizations to Consider

### 1. Separate Auth Routes
Create a separate route for authenticated gallery viewing:
- `/gallery/[slug]` - Public, heavily cached
- `/gallery/[slug]/manage` - Authenticated, not cached

### 2. Static Generation
For popular galleries, consider static generation:
```typescript
export async function generateStaticParams() {
  // Generate paths for popular galleries
  return popularGalleries.map(g => ({ slug: g.slug }))
}
```

### 3. Regional Cache Purging
Use Vercel's API to purge cache when galleries are updated:
```typescript
await fetch('https://api.vercel.com/v1/cache/purge', {
  method: 'POST',
  headers: { 'x-vercel-token': process.env.VERCEL_TOKEN },
  body: JSON.stringify({ 
    tags: [`gallery-${slug}`] 
  })
})
```

## Monitoring

Watch these metrics after deployment:
- **Edge Cache Hit Rate**: Should increase to 80%+
- **Lambda Invocations**: Should decrease significantly
- **Response Times**: P95 should drop below 100ms
- **Bandwidth Costs**: Should reduce as Edge serves cached responses

## Rollback Plan

If issues arise, remove cache headers from middleware:
1. Comment out cache header lines in middleware
2. Deploy immediately
3. All requests will bypass cache as before
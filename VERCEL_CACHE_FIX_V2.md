# Vercel Edge Caching Fix for Gallery Pages - Static Route Approach

## Problem Summary
Gallery pages at `/gallery/[slug]` aren't being cached at Vercel's Edge because:
- Server-side session checks make the route dynamic
- Cookie operations prevent Edge caching
- No proper cache headers are set

## Solution: Make Gallery Routes Truly Static

The correct approach is to make gallery pages static with ISR (Incremental Static Regeneration) and handle authentication client-side.

## Implementation

### 1. Static Gallery Page (`src/app/gallery/[slug]/page.tsx.new`)

**Key Changes:**
- **Remove all server-side auth checks** - No `getSession()` calls
- **Use ISR with `revalidate`** - Cache pages for 10 minutes
- **Client-side auth wrapper** - Handle privileged UI client-side

```typescript
// Make route static with ISR
export const revalidate = 600 // 10 minutes
export const dynamicParams = true

// NO session checks in the server component
// Fetch only public data
const eventWithAlbums = await getCachedEventData(slug, false)
const galleryData = await getCachedGalleryData(eventWithAlbums.id, false)

// Wrap with client auth component for privileged features
return (
  <GalleryAuthWrapper 
    eventId={eventWithAlbums.id}
    eventSlug={slug}
    defaultContent={<PublicGalleryView />}
  />
)
```

### 2. Client Auth Wrapper (`src/components/gallery/gallery-auth-wrapper.tsx`)

Handles authentication client-side without affecting static generation:

```typescript
"use client"

export function GalleryAuthWrapper({ eventId, defaultContent }) {
  const { data: session } = authClient.useSession()
  const [hasAccess, setHasAccess] = useState(false)
  
  useEffect(() => {
    // Check access via API
    if (session?.user) {
      fetch(`/api/events/${eventId}/access`)
        .then(res => res.json())
        .then(data => setHasAccess(data.hasAccess))
    }
  }, [session])
  
  // Show enhanced view for authorized users
  if (hasAccess) {
    return <EnhancedGalleryView />
  }
  
  // Show default public view
  return defaultContent
}
```

### 3. Simplified Middleware (`src/middleware.ts`)

Complements static caching with Edge headers:

```typescript
if (request.nextUrl.pathname.startsWith('/gallery/')) {
  const sessionCookie = getSessionCookie(request)
  
  // Only set cache headers for unauthenticated users
  // Don't set cookies - keep route static
  if (!sessionCookie) {
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=60')
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  }
}
```

### 4. On-Demand Revalidation (Already Implemented)

Upload handlers already call `revalidatePath()`:

```typescript
// In /api/upload/route.ts
if (result.eventSlug) {
  revalidatePath(`/gallery/${result.eventSlug}`)
}

// In /api/uploads/[id]/approve/route.ts
revalidateTag('gallery')
```

## How It Works

### Request Flow:

1. **First Request (Cold Cache)**
   - Next.js generates static HTML
   - Vercel caches at Edge with `s-maxage=600`
   - Response: `x-vercel-cache: MISS`

2. **Subsequent Requests (Within 10 min)**
   - Served directly from Edge cache
   - No Lambda execution
   - Response: `x-vercel-cache: HIT`

3. **After Upload**
   - `revalidatePath()` invalidates cache
   - Next request regenerates page
   - New version cached at Edge

### Authentication Flow:

1. **Public Users**
   - Get static cached page instantly
   - No auth checks, no dynamic rendering

2. **Authenticated Users**
   - Get same static page initially
   - Client component checks auth via API
   - Enhanced UI renders client-side if authorized

## Benefits

- **True static generation** - Pages are pre-rendered and cached
- **Edge caching works** - No dynamic rendering to break cache
- **Instant updates** - On-demand revalidation after uploads
- **Optimal performance** - Public users get static pages
- **Proper auth** - Privileged features load client-side

## Testing

1. Deploy changes
2. Visit gallery page - check for `x-vercel-cache: HIT`
3. Upload photo - gallery updates immediately
4. Sign in - see owner/member features load

## Key Differences from V1

| Aspect | V1 (Middleware-only) | V2 (Static Route) |
|--------|---------------------|-------------------|
| **Primary mechanism** | Middleware headers | ISR with revalidate |
| **Session checks** | Server-side | Client-side only |
| **Cookie operations** | Set guest cookies | No cookies |
| **Route type** | Dynamic | Static |
| **Cache invalidation** | Time-based only | On-demand + time |
| **Edge cache** | Attempted via headers | Native ISR support |

## Migration Steps

1. Replace current `page.tsx` with `page.tsx.new`
2. Deploy and test
3. Monitor cache hit rates
4. Adjust revalidation time if needed
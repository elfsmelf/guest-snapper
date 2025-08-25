export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image Hero Section Skeleton */}
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden bg-muted animate-pulse">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="h-8 md:h-10 lg:h-12 bg-background/30 rounded w-64 md:w-80 mx-auto mb-2 animate-pulse" />
            <div className="h-5 md:h-6 bg-background/20 rounded w-48 md:w-64 mx-auto animate-pulse" />
          </div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center gap-2 justify-center">
          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 bg-background min-h-screen">
        {/* Tabs Skeleton */}
        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <div className="h-10 w-24 bg-card rounded animate-pulse" />
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 w-28 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Search and Filters Skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-10 bg-card rounded animate-pulse" />
          <div className="h-10 w-10 bg-card rounded animate-pulse" />
        </div>

        {/* Masonry Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className={`bg-muted rounded-lg animate-pulse ${
              i % 7 === 0 ? 'h-64' : 
              i % 5 === 0 ? 'h-48' : 
              i % 3 === 0 ? 'h-56' : 'h-52'
            }`} />
          ))}
        </div>
      </div>
    </div>
  )
}
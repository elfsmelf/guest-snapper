export default function EventDetailLoading() {
  return (
    <div className="w-full overflow-hidden space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center space-x-4">
        <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
      
      {/* Hero skeleton */}
      <div className="relative overflow-hidden rounded-xl h-64 md:h-80 lg:h-96 bg-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-200" />
        <div className="relative px-4 sm:px-8 py-8 sm:py-12">
          <div className="max-w-4xl space-y-4">
            <div className="h-10 w-64 bg-gray-400/50 rounded animate-pulse" />
            <div className="h-6 w-48 bg-gray-400/30 rounded animate-pulse" />
            <div className="h-5 w-56 bg-gray-400/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Grid layout skeleton */}
      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4 w-full min-w-0">
        {/* Main content */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6 min-w-0">
          {/* Quick actions skeleton */}
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          
          {/* Event settings skeleton */}
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
          
          {/* Statistics skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
          
          {/* Albums skeleton */}
          <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
          
          {/* Collaborators skeleton */}
          <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        
        {/* Sidebar skeleton */}
        <div className="space-y-6 min-w-0 w-full">
          {/* Gallery info skeleton */}
          <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          
          {/* QR code skeleton */}
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          
          {/* Slideshow settings skeleton */}
          <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
          
          {/* Download skeleton */}
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}
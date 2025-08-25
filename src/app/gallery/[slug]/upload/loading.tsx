import { Upload } from "lucide-react"

export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image Header skeleton */}
      <div className="relative h-32 md:h-40 overflow-hidden bg-muted animate-pulse">
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="h-8 w-48 bg-background/30 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-4 w-64 bg-background/20 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back button skeleton */}
        <div className="mb-6">
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        </div>

        {/* Upload Interface skeleton */}
        <div className="max-w-4xl mx-auto">
          <div className="p-6">
            <div className="h-6 w-48 bg-muted rounded mb-2 animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded mb-8 animate-pulse" />
          </div>

          {/* Upload interface placeholder */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <div className="animate-pulse space-y-6">
              {/* File upload area */}
              <div className="border-2 border-dashed border-border rounded-lg h-48 bg-muted" />
              
              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
              
              {/* Upload button */}
              <div className="h-12 bg-muted rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
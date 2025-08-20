import { Upload } from "lucide-react"

export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image Header skeleton */}
      <div className="relative h-48 md:h-64 overflow-hidden bg-gray-200 animate-pulse">
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="h-8 w-48 bg-white/30 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-4 w-64 bg-white/20 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back button skeleton */}
        <div className="mb-6">
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Upload Interface skeleton */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-300 animate-pulse" />
            </div>
            <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-5 w-64 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>

          {/* Upload interface placeholder */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="animate-pulse space-y-6">
              {/* File upload area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 bg-gray-50" />
              
              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
              
              {/* Upload button */}
              <div className="h-12 bg-gray-200 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
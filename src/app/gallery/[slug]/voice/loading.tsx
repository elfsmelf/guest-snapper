import { Mic } from "lucide-react"

export default function VoiceLoading() {
  return (
    <div className="min-h-screen bg-pink-50/30">
      {/* Compact Cover Image Header Skeleton */}
      <div className="relative h-32 md:h-40 overflow-hidden bg-gray-300 animate-pulse">
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content Overlay Skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="h-6 md:h-8 w-48 md:w-64 bg-white/20 rounded mx-auto mb-1 animate-pulse" />
            <div className="h-4 md:h-5 w-32 md:w-40 bg-white/20 rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Owner badge skeleton (hidden by default, shown when needed) */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="container mx-auto px-4 py-2">
          <div className="h-4 w-40 bg-yellow-200 rounded mx-auto animate-pulse" />
        </div>
      </div>
      
      {/* Voice Recorder Component Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Uploader Information Card */}
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Voice Recorder Card */}
          <div className="mb-6 bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-gray-300 animate-pulse" />
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="p-6">
              {/* Recording Interface Skeleton */}
              <div className="border rounded-lg p-4 bg-white">
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-12 w-36 bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                  <div className="h-4 w-64 bg-gray-100 rounded mt-4 mx-auto animate-pulse" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
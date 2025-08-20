import { Mic } from "lucide-react"

export default function VoiceLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back button skeleton */}
        <div className="mb-6">
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Voice recorder skeleton */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Mic className="w-8 h-8 text-red-300 animate-pulse" />
            </div>
            <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-5 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
          </div>

          {/* Voice recorder interface skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="animate-pulse space-y-6">
              {/* Waveform placeholder */}
              <div className="h-32 bg-gray-200 rounded-lg" />
              
              {/* Control buttons */}
              <div className="flex justify-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
              </div>
              
              {/* Message input */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
              
              {/* Submit button */}
              <div className="h-12 bg-gray-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
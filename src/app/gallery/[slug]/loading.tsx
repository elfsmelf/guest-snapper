import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye } from "lucide-react"

export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-pink-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Back button skeleton */}
          <div className="mb-6 flex justify-start">
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Cover Image skeleton */}
          <div className="mb-8">
            <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          
          {/* Event Header skeleton */}
          <div className="mb-8 space-y-3">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-56 mx-auto animate-pulse" />
          </div>

          {/* Gallery content skeleton */}
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Eye className="w-8 h-8 text-pink-300" />
              </div>
              <CardTitle className="text-xl text-gray-900">Loading Gallery...</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-32 bg-gray-200 rounded" />
                  <div className="h-32 bg-gray-200 rounded" />
                  <div className="h-32 bg-gray-200 rounded" />
                  <div className="h-32 bg-gray-200 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
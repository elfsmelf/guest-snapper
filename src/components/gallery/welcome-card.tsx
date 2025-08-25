"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
// import { motion } from "framer-motion" // Commenting out for now

interface WelcomeCardProps {
  eventName: string
  eventSlug: string
  photoCount: number
}

export function WelcomeCard({ eventName, eventSlug, photoCount }: WelcomeCardProps) {
  // Only show if no photos have been uploaded yet
  if (photoCount > 0) {
    return null
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Welcome to Your Gallery!</CardTitle>
          </div>
          <CardDescription className="text-base">
            Your beautiful gallery for {eventName} is ready to receive its first photos. 
            Let's start by uploading some test images to see how everything looks!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="flex-1">
              <Link href={`/gallery/${eventSlug}/upload`}>
                <Camera className="mr-2 h-5 w-5" />
                Upload Your First Photos
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href={`/gallery/${eventSlug}/upload`}>
                <ArrowRight className="mr-2 h-5 w-5" />
                Take a Test Photo
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Don't worry, you can delete test photos anytime. This helps you see how your gallery will look to guests!
          </p>
        </CardContent>
      </Card>
  )
}
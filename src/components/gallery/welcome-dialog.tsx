"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Sparkles, 
  Eye, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Settings,
  Rocket
} from "lucide-react"

interface WelcomeDialogProps {
  open: boolean
  onClose: () => void
  eventName: string
  eventSlug: string
  currentStep?: number
}

export function WelcomeDialog({ 
  open, 
  onClose, 
  eventName, 
  eventSlug,
  currentStep = 3 
}: WelcomeDialogProps) {
  const router = useRouter()

  const handleContinueSetup = () => {
    onClose()
    router.push(`/onboarding?slug=${eventSlug}&step=${currentStep}`)
  }

  const handleExploreLater = () => {
    onClose()
    // User stays on gallery page
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 border-0 bg-transparent">
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-2xl">
          <DialogHeader className="p-8 pb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              🎉 Welcome to Your Gallery!
            </DialogTitle>
            <DialogDescription className="text-center text-lg mt-4 text-muted-foreground">
              Congratulations! You've successfully created your <strong>{eventName}</strong> gallery. 
              This is exactly what your guests will see when they visit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-8 pb-8">
            {/* What guests will see */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="text-center p-4 bg-card/50">
                  <Eye className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                  <h4 className="font-semibold mb-2">Your Photos</h4>
                  <p className="text-sm text-muted-foreground">
                    Guests can view all uploaded memories
                  </p>
                </Card>
                <Card className="text-center p-4 bg-card/50">
                  <Users className="h-8 w-8 mx-auto mb-3 text-green-500" />
                  <h4 className="font-semibold mb-2">Easy Sharing</h4>
                  <p className="text-sm text-muted-foreground">
                    Simple upload interface for all guests
                  </p>
                </Card>
                <Card className="text-center p-4 bg-card/50">
                  <Settings className="h-8 w-8 mx-auto mb-3 text-purple-500" />
                  <h4 className="font-semibold mb-2">Full Control</h4>
                  <p className="text-sm text-muted-foreground">
                    You can customize everything
                  </p>
                </Card>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-start gap-3">
                  <Rocket className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Complete Your Setup</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      You're halfway done! Finish configuring privacy, guest limits, and publishing 
                      to make your gallery ready for guests.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={handleContinueSetup}
                  size="lg"
                  className="flex-1 h-12 text-base font-semibold"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Continue Setup
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  onClick={handleExploreLater}
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12 text-base"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Explore Gallery First
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                You can always complete setup later from the header or dashboard
              </p>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Users, Crown, Shield, User, CheckCircle } from "lucide-react"
import { type OnboardingState } from "@/types/onboarding"
import { updateOnboardingProgress } from "@/app/actions/onboarding"
import { CollaboratorsSection } from "@/components/collaborators-section"
import { useCollaboratorsData, useCollaboratorProgress } from "@/hooks/use-onboarding"

interface CollaboratorsStepProps {
  eventId: string
  eventSlug: string
  eventName: string
  state: OnboardingState
  onUpdate: (updates: Partial<OnboardingState>) => void
  onComplete: () => Promise<any>
}

export function CollaboratorsStep({
  eventId,
  eventSlug,
  eventName,
  state,
  onUpdate,
  onComplete
}: CollaboratorsStepProps) {
  // Use prefetched collaborators data
  const { data: collaboratorsData } = useCollaboratorsData(eventId)
  const collaboratorProgress = useCollaboratorProgress(eventId)
  
  // Calculate if user has collaborators
  const hasCollaborators = collaboratorsData?.success ? 
    ((collaboratorsData.members?.length || 0) + (collaboratorsData.invitations?.length || 0)) > 1 : 
    false
  
  const collaboratorCount = collaboratorsData?.success ? 
    ((collaboratorsData.members?.length || 0) + (collaboratorsData.invitations?.length || 0)) : 0

  // Handle collaborator changes through React Query mutation
  const handleCollaboratorChange = () => {
    // Trigger the mutation to update progress based on current collaborator data
    collaboratorProgress.mutate()
  }


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Add Team Members</h3>
        <p className="text-muted-foreground">
          Invite team members to help manage your gallery (optional but helpful for larger events).
        </p>
      </div>

      {/* Landscape Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Management Section - Takes 2 columns */}
        <div className="lg:col-span-2">
          <CollaboratorsSection
            eventId={eventId}
            isOwner={true}
            initialData={collaboratorsData}
            onDataChange={handleCollaboratorChange}
          />
        </div>

        {/* Information & Benefits Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Information */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Team Roles:</div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Crown className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Owner</div>
                    <div className="text-xs text-muted-foreground">Full access including team management</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Admin</div>
                    <div className="text-xs text-muted-foreground">Can manage gallery settings and uploads</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Member</div>
                    <div className="text-xs text-muted-foreground">Can view and upload photos</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="text-sm font-medium">Why add team members?</div>
              
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  • Share gallery management workload
                </div>
                <div className="text-xs text-muted-foreground">
                  • Multiple people can upload and organize
                </div>
                <div className="text-xs text-muted-foreground">
                  • Perfect for wedding planners & photographers
                </div>
                <div className="text-xs text-muted-foreground">
                  • Family members can help manage content
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">💡 Common Uses</div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• Wedding: Invite photographer & planner</div>
                <div>• Corporate: Add event organizers</div>
                <div>• Family: Include relatives as helpers</div>
                <div>• Birthday: Let friends help organize</div>
              </div>
            </div>

            {hasCollaborators && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  Team members added!
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {!hasCollaborators && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You can always add team members later from your gallery settings
          </p>
        </div>
      )}
    </div>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserPlus, Users, Crown, Shield, User, Trash2, Loader2, Mail, X } from 'lucide-react'
import { InviteCollaboratorDialog } from './invite-collaborator-dialog'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

interface Member {
  id: string
  userId: string
  role: "member" | "admin" | "owner"
  user?: {
    id: string
    name?: string
    email: string
  }
}

interface Invitation {
  id: string
  email: string
  role: "member" | "admin" | "owner"
  status: string
  expiresAt: string
  createdAt: string
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface CollaboratorsSectionProps {
  eventId: string
  isOwner: boolean
}

export function CollaboratorsSection({ eventId, isOwner }: CollaboratorsSectionProps) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)
  const [processingInvitations, setProcessingInvitations] = useState<Set<string>>(new Set())
  const [removingMembers, setRemovingMembers] = useState<Set<string>>(new Set())

  const fetchOrganizationData = async () => {
    try {
      console.log('Fetching organization data for event:', eventId)
      const response = await fetch(`/api/events/${eventId}/organization`)
      if (!response.ok) {
        throw new Error('Failed to fetch organization data')
      }
      
      const data = await response.json()
      console.log('Fetched organization data:', data)
      
      if (data.success) {
        console.log('Setting organization data:', {
          organization: data.organization,
          members: data.members?.length || 0,
          invitations: data.invitations?.length || 0
        })
        setOrganization(data.organization)
        setMembers(data.members || [])
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching organization data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createOrganization = async () => {
    setIsCreatingOrg(true)
    try {
      const response = await fetch(`/api/events/${eventId}/organization`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to create organization')
      }

      const data = await response.json()
      if (data.success) {
        toast.success('Organization created! You can now invite collaborators.')
        await fetchOrganizationData()
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization')
    } finally {
      setIsCreatingOrg(false)
    }
  }

  const handleInviteSent = () => {
    fetchOrganizationData() // Refresh data after invite
  }

  const handleResendInvitation = async (invitationId: string, email: string, role: "member" | "admin" | "owner") => {
    if (!organization?.id) return

    setProcessingInvitations(prev => new Set(prev.add(invitationId)))
    try {
      // First cancel the existing invitation, then send a new one
      await (authClient as any).organization.cancelInvitation({
        invitationId
      })

      // Send a fresh invitation
      const result = await (authClient as any).organization.inviteMember({
        email,
        role,
        organizationId: organization.id
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to resend invitation')
      }

      toast.success(`Invitation resent to ${email}`)
      fetchOrganizationData() // Refresh data
    } catch (error: any) {
      console.error('Failed to resend invitation:', error)
      toast.error(error.message || 'Failed to resend invitation')
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev)
        newSet.delete(invitationId)
        return newSet
      })
    }
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    console.log('Canceling invitation:', { invitationId, email })
    setProcessingInvitations(prev => new Set(prev.add(invitationId)))
    
    try {
      const result = await (authClient as any).organization.cancelInvitation({
        invitationId
      })

      console.log('Cancel invitation result:', result)

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to cancel invitation')
      }

      toast.success(`Invitation to ${email} has been canceled`)
      
      // Force a refresh of the data
      console.log('Refreshing organization data after cancellation...')
      await fetchOrganizationData()
      console.log('Data refreshed successfully')
      
    } catch (error: any) {
      console.error('Failed to cancel invitation:', error)
      toast.error(error.message || 'Failed to cancel invitation')
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev)
        newSet.delete(invitationId)
        return newSet
      })
    }
  }

  const handleRemoveMember = async (memberId: string, userEmail: string, userRole: string) => {
    if (userRole.toLowerCase() === 'owner') {
      toast.error('Cannot remove the organization owner')
      return
    }

    // Optimistic update - immediately remove from UI
    const previousMembers = [...members]
    setMembers(prev => prev.filter(member => member.id !== memberId))
    setRemovingMembers(prev => new Set(prev.add(memberId)))
    
    try {
      const result = await (authClient as any).organization.removeMember({
        memberIdOrEmail: userEmail,
        organizationId: organization?.id
      })

      if (result?.error) {
        throw new Error(result.error.message || 'Failed to remove member')
      }

      toast.success(`${userEmail} has been removed from the organization`)
      // Don't need to fetch data since we already updated optimistically
    } catch (error: any) {
      // Revert optimistic update on error
      setMembers(previousMembers)
      console.error('Failed to remove member:', error)
      toast.error(error.message || 'Failed to remove member')
    } finally {
      setRemovingMembers(prev => {
        const newSet = new Set(prev)
        newSet.delete(memberId)
        return newSet
      })
    }
  }

  useEffect(() => {
    fetchOrganizationData()
  }, [eventId])

  const getRoleIcon = (role: "member" | "admin" | "owner") => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />
      default:
        return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleBadge = (role: "member" | "admin" | "owner") => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Owner</Badge>
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>
      default:
        return <Badge variant="secondary">Member</Badge>
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!organization && isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Enable Collaboration</h3>
            <p className="text-muted-foreground mb-6">
              Create a team for this event to invite others to help you manage it.
            </p>
            <Button onClick={createOrganization} disabled={isCreatingOrg}>
              {isCreatingOrg ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Team...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enable Collaboration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Collaboration is not enabled for this event.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Collaborators ({members.length + invitations.length})
            </div>
            {isOwner && (
              <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 || invitations.length > 0 ? (
            <div className="space-y-4">
              {/* Active Members */}
              {members.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Active Members</h4>
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(member.user?.name, member.user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {member.user?.name || member.user?.email || 'Unknown User'}
                            </span>
                            {getRoleIcon(member.role)}
                          </div>
                          {member.user?.email && (
                            <p className="text-sm text-muted-foreground">
                              {member.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(member.role)}
                        {isOwner && member.role.toLowerCase() !== 'owner' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMember(member.id, member.user?.email || 'Unknown', member.role)}
                            disabled={removingMembers.has(member.id)}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:border-red-300"
                            title="Remove member"
                          >
                            {removingMembers.has(member.id) ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Pending Invitations</h4>
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-yellow-100">
                            {getInitials('', invitation.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{invitation.email}</span>
                            {getRoleIcon(invitation.role)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Invited • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                          Pending
                        </Badge>
                        {getRoleBadge(invitation.role)}
                        
                        {isOwner && (
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendInvitation(invitation.id, invitation.email, invitation.role)}
                              disabled={processingInvitations.has(invitation.id)}
                              className="h-8 px-2"
                              title="Resend invitation email"
                            >
                              {processingInvitations.has(invitation.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                              disabled={processingInvitations.has(invitation.id)}
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:border-red-300"
                              title="Cancel invitation"
                            >
                              {processingInvitations.has(invitation.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No collaborators yet. Invite someone to help manage this event.
              </p>
              {isOwner && (
                <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Collaborator
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteCollaboratorDialog
        eventId={eventId}
        organizationId={organization?.id}
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        onInviteSent={handleInviteSent}
      />
    </>
  )
}
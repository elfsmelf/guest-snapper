"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UserPlus, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

interface InviteCollaboratorDialogProps {
  eventId: string
  organizationId?: string | null
  isOpen: boolean
  onClose: () => void
  onInviteSent: () => void
}

export function InviteCollaboratorDialog({ 
  eventId, 
  organizationId, 
  isOpen, 
  onClose, 
  onInviteSent 
}: InviteCollaboratorDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [showResendOption, setShowResendOption] = useState(false)

  const handleInvite = async (e: React.FormEvent, resend = false) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }

    if (!organizationId) {
      toast.error('No organization found for this event')
      return
    }

    setIsInviting(true)
    try {
      console.log('Sending invitation:', { email: email.trim(), role, organizationId, resend })
      
      // Use Better Auth's organization client to send invitation
      const result = await authClient.organization.inviteMember({
        email: email.trim(),
        role: role,
        organizationId: organizationId,
        resend: resend
      })

      console.log('Invitation result:', result)

      if (result?.error) {
        console.error('Invitation error details:', result.error)
        throw new Error(result.error.message || 'Failed to send invitation')
      }

      const message = resend ? `Invitation resent to ${email}` : `Invitation sent to ${email}`
      toast.success(message)
      onInviteSent()
      
      // Reset form and close dialog
      setEmail('')
      setRole('member')
      setShowResendOption(false)
      onClose()
    } catch (error: any) {
      console.error('Failed to invite collaborator:', error)
      
      // Handle specific error cases with better messaging
      let errorMessage = 'Failed to send invitation'
      
      if (error.message?.includes('already invited')) {
        errorMessage = `${email} has already been invited to this organization`
        setShowResendOption(true) // Show resend option
      } else if (error.message?.includes('already a member')) {
        errorMessage = `${email} is already a member of this organization`
        setShowResendOption(false)
      } else if (error.message?.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address'
        setShowResendOption(false)
      } else if (error.message) {
        errorMessage = error.message
        setShowResendOption(false)
      }
      
      toast.error(errorMessage)
      
      // Don't close dialog if we're showing resend option
      if (!showResendOption) {
        // Reset form for other errors but keep dialog open for already invited case
      }
    } finally {
      setIsInviting(false)
    }
  }

  const handleClose = () => {
    if (!isInviting) {
      setEmail('')
      setRole('member')
      setShowResendOption(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleInvite}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite Collaborator
            </DialogTitle>
            <DialogDescription>
              Invite someone to help manage this event. They'll be able to view settings, manage uploads, and collaborate with you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collaborator-email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="collaborator-email"
                  type="email"
                  placeholder="Enter email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isInviting}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collaborator-role">Role</Label>
              <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div>
                      <div className="font-medium">Member</div>
                      <div className="text-xs text-muted-foreground">Can view and manage basic event settings</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-muted-foreground">Full access to all event settings and management</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isInviting}
            >
              Cancel
            </Button>
            
            {showResendOption && (
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => handleInvite(e, true)}
                disabled={!email.trim() || isInviting}
              >
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Invitation
                  </>
                )}
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={!email.trim() || isInviting}
            >
              {isInviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {showResendOption ? 'Resending...' : 'Sending Invite...'}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
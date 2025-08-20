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
import { Separator } from '@/components/ui/separator'
import { Loader2, UserPlus, Mail, Copy, Link2, Check } from 'lucide-react'
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
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

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
      const result = await (authClient as any).organization.inviteMember({
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

      // Generate invitation URL if we have an invitation ID
      if (result?.data?.id) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        const inviteUrl = `${baseUrl}/api/accept-invitation/${result.data.id}`
        setInvitationUrl(inviteUrl)
      }

      const message = resend ? `Invitation resent to ${email}` : `Invitation sent to ${email}`
      toast.success(message)
      onInviteSent()
      
      // Don't close dialog immediately - show the invitation URL
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

  const handleCopyUrl = async () => {
    if (invitationUrl) {
      try {
        await navigator.clipboard.writeText(invitationUrl)
        setIsCopied(true)
        toast.success('Invitation URL copied to clipboard')
        setTimeout(() => setIsCopied(false), 2000)
      } catch (error) {
        toast.error('Failed to copy URL')
      }
    }
  }

  const handleClose = () => {
    if (!isInviting) {
      setEmail('')
      setRole('member')
      setShowResendOption(false)
      setInvitationUrl(null)
      setIsCopied(false)
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
            {!invitationUrl ? (
              <>
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
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="font-medium">Invitation Sent!</h3>
                  <p className="text-sm text-muted-foreground">
                    An email has been sent to <strong>{email}</strong> with the invitation.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="w-4 h-4" />
                    Backup Invitation Link
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link directly if the email doesn't arrive:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={invitationUrl}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUrl}
                      className="shrink-0"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {!invitationUrl ? (
              <>
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
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInvitationUrl(null)
                    setEmail('')
                    setRole('member')
                    setShowResendOption(false)
                  }}
                >
                  Send Another
                </Button>
                <Button
                  type="button"
                  onClick={handleClose}
                >
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
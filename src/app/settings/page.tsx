"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Settings as SettingsIcon, User, Save } from 'lucide-react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  SessionsCard,
  AccountsCard,
  DeleteAccountCard,
  ProvidersCard,
  UpdateNameCard,
  ChangeEmailCard
} from '@daveyplate/better-auth-ui'

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  // Form state for profile information
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/auth/sign-in')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session])

  useEffect(() => {
    // Check if there are any changes
    const nameChanged = name !== (session?.user?.name || '')
    const emailChanged = email !== (session?.user?.email || '')
    setHasChanges(nameChanged || emailChanged)
  }, [name, email, session])

  const handleSave = async () => {
    if (!hasChanges) return

    setIsLoading(true)
    try {
      // TODO: Implement actual update logic with Better Auth
      console.log('Saving changes:', { name, email })
      // For now, just show success
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }

  if (isPending) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and profile information.
        </p>
      </div>

      {/* Settings Content */}
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Display (non-editable) */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium">Profile Picture</p>
                <p className="text-sm text-muted-foreground">
                  Managed by your authentication provider
                </p>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Save/Reset Buttons - Only show if there are changes */}
            {hasChanges && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account ID:</span>
                <span className="font-mono text-xs">{session.user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since:</span>
                <span>{new Date(session.user.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Better Auth UI Cards */}
        <SessionsCard />

        <AccountsCard />

        <ProvidersCard />

        <DeleteAccountCard />

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              For password changes or other security settings, please contact our support team.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="mailto:support@guestsnapper.com">
                Contact Support
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-6 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Need help? Contact us at support@guestsnapper.com
        </p>
      </div>
    </div>
  )
}
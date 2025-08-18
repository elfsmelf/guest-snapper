import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { ArrowLeft, User, CreditCard, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function SettingsPage() {
  // Server-side authentication check
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const user = session?.user

  if (!user) {
    return null // This should be handled by layout redirect
  }

  // User data is already available from Better Auth session
  const userProfile = user

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your basic account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">
                {user.email || 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">
                {user.name || 'Not set'}
              </p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/settings">
                Manage Account Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
          </CardTitle>
          <CardDescription>
            Your current plan and usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Current Plan</h4>
              <p className="text-sm text-muted-foreground">
                You're currently on the{' '}
                <Badge variant="secondary">
                  Trial
                </Badge>{' '}
                plan
              </p>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/40">
            <h4 className="font-medium text-sm">Trial Usage</h4>
            <p className="text-sm text-muted-foreground">
              0 uploads used
            </p>
          </div>

          <div className="pt-4">
            <Button size="sm">
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Manage your privacy and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable 2FA
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Active Sessions</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your active login sessions
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/settings">
                  View Sessions
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
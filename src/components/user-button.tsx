"use client"

import { User, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/actions/logout"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserButtonProps {
  size?: "default" | "sm" | "lg" | "icon"
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserButton({ size = "icon", user }: UserButtonProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      // Call server action to properly invalidate caches
      await logoutAction()
      
      // Force router refresh to get fresh server components
      router.refresh()
      
      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback redirect in case of error
      window.location.href = "/"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size}>
          {user?.image ? (
            <img 
              src={user.image} 
              alt={user.name || "User"} 
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user?.name && (
          <DropdownMenuItem disabled>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.name}</p>
              {user.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
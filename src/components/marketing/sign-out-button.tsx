"use client"

import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/actions/logout"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function SignOutButton() {
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
    <DropdownMenuItem onClick={handleSignOut}>
      Sign Out
    </DropdownMenuItem>
  )
}
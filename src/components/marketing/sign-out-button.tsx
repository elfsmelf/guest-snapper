"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      // Use Better Auth client signOut - this automatically updates useSession hooks
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Redirect to home page after successful signout
            router.push("/")
          },
          onError: (ctx) => {
            console.error('Sign out error:', ctx.error)
            // Fallback redirect in case of error
            router.push("/")
          }
        }
      })
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback redirect in case of error
      router.push("/")
    }
  }

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      Sign Out
    </DropdownMenuItem>
  )
}
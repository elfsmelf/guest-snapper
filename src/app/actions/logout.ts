"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function logoutAction() {
  try {
    // Get current session to know which user is logging out
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    const userId = session?.user?.id
    
    // Better Auth signOut handles session termination and cookie cleanup automatically
    await auth.api.signOut({
      headers: await headers()
    })
    
    // Invalidate all session-related caches
    revalidateTag('session')
    if (userId) {
      revalidateTag(`session:${userId}`)
    }
    
    // Invalidate organization-related caches (important for collaborative workspaces)
    revalidateTag('organization')
    revalidateTag('organization-members')
    
    // Invalidate all paths that depend on auth state
    revalidatePath('/', 'layout') // Invalidate root layout and all nested routes
    revalidatePath('/dashboard')
    revalidatePath('/auth/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Server logout error:', error)
    
    // If Better Auth signOut fails, still invalidate caches to prevent stale data
    revalidateTag('session')
    revalidateTag('organization') 
    revalidateTag('organization-members')
    revalidatePath('/', 'layout')
    
    return { success: true } // Return success anyway to complete logout
  }
}
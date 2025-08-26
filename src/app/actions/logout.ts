"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { cookies, headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function logoutAction() {
  try {
    // Get current session to know which user is logging out
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    const userId = session?.user?.id
    
    // Call Better Auth signOut API to terminate session server-side
    await auth.api.signOut({
      headers: await headers()
    })
    
    // Delete the session cookie manually to ensure immediate invalidation
    const cookieStore = await cookies()
    cookieStore.delete('better-auth.session_token')
    cookieStore.delete('better-auth.csrf_token') 
    
    // Invalidate all session-related caches
    revalidateTag('session')
    if (userId) {
      revalidateTag(`session:${userId}`)
    }
    
    // Invalidate all paths that depend on auth state
    revalidatePath('/', 'layout') // Invalidate root layout and all nested routes
    revalidatePath('/dashboard')
    revalidatePath('/auth/settings')
    
    return { success: true }
  } catch (error) {
    console.error('Server logout error:', error)
    
    // Even if Better Auth API fails, clear cookies and caches
    const cookieStore = await cookies()
    cookieStore.delete('better-auth.session_token')
    cookieStore.delete('better-auth.csrf_token')
    
    revalidateTag('session')
    revalidatePath('/', 'layout')
    
    return { success: true } // Return success anyway to complete logout
  }
}
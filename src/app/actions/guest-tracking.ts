'use server'

import { cookies } from 'next/headers'

/**
 * Initializes a guest ID cookie for anonymous user tracking
 * Returns the guest ID (existing or newly created)
 */
export async function initializeGuestId(): Promise<string> {
  const cookieStore = await cookies()
  
  // Check if guest ID already exists
  const existingGuestId = cookieStore.get('guest_id')?.value
  
  if (existingGuestId) {
    return existingGuestId
  }
  
  // Generate new guest ID
  const guestId = crypto.randomUUID()
  
  // Set guest ID cookie with proper security settings
  cookieStore.set('guest_id', guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    path: '/',
  })
  
  return guestId
}

/**
 * Gets the current guest ID from cookies
 */
export async function getGuestId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('guest_id')?.value || null
}
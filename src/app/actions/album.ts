"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/database/db"
import { albums } from "@/database/schema"
import { eq, and } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { getEventWithAccess } from "@/lib/auth-helpers"

export async function toggleAlbumVisibility(albumId: string) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: "Authentication required" }
    }

    // Get the album first to check access
    const album = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1)

    if (!album.length) {
      return { success: false, error: "Album not found" }
    }

    // Check if user has access to the event
    const eventAccess = await getEventWithAccess(album[0].eventId, session.user.id)

    if (!eventAccess?.isOwner) {
      return { success: false, error: "You don't have permission to modify this album" }
    }

    // Toggle the visibility
    const currentVisibility = album[0].isVisible
    await db
      .update(albums)
      .set({
        isVisible: !currentVisibility,
        updatedAt: new Date()
      })
      .where(eq(albums.id, albumId))

    // Revalidate relevant caches
    revalidateTag(`albums-${album[0].eventId}`)
    revalidateTag(`event-${album[0].eventId}`)

    return {
      success: true,
      isVisible: !currentVisibility,
      message: `Album ${!currentVisibility ? 'shown' : 'hidden'} successfully`
    }
  } catch (error) {
    console.error("Failed to toggle album visibility:", error)
    return { success: false, error: "Failed to update album visibility" }
  }
}

export async function toggleAlbumFavorite(albumId: string) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return { success: false, error: "Authentication required" }
    }

    // Get the album first to check access
    const album = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1)

    if (!album.length) {
      return { success: false, error: "Album not found" }
    }

    // Check if user has access to the event
    const eventAccess = await getEventWithAccess(album[0].eventId, session.user.id)

    if (!eventAccess?.isOwner) {
      return { success: false, error: "You don't have permission to modify this album" }
    }

    const currentFavorite = album[0].isFavorite

    // If setting as favorite, unfavorite all other albums in this event
    if (!currentFavorite) {
      await db
        .update(albums)
        .set({
          isFavorite: false,
          updatedAt: new Date()
        })
        .where(eq(albums.eventId, album[0].eventId))
    }

    // Toggle the favorite status
    await db
      .update(albums)
      .set({
        isFavorite: !currentFavorite,
        updatedAt: new Date()
      })
      .where(eq(albums.id, albumId))

    // Revalidate relevant caches
    revalidateTag(`albums-${album[0].eventId}`)
    revalidateTag(`event-${album[0].eventId}`)

    return {
      success: true,
      isFavorite: !currentFavorite,
      message: `Album ${!currentFavorite ? 'set as favorite' : 'removed from favorites'}`
    }
  } catch (error) {
    console.error("Failed to toggle album favorite:", error)
    return { success: false, error: "Failed to update album favorite status" }
  }
}
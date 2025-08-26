import { getGuestOwnContent } from './guest-content-helpers'
import { getCachedGalleryData } from './gallery-cache'

export type UIMode = 'GUEST_UI' | 'OWNER_UI' | 'AUTH_UI'

export interface GalleryAccessResult {
  content: {
    uploads: any[]
    pendingUploads: any[]
    guestbookEntries: any[]
  }
  uiMode: UIMode
  showAllContent: boolean
  isGuestOwnContent: boolean
}

/**
 * Unified logic to determine what content to show and which UI to use
 */
export async function determineGalleryAccess({
  eventData,
  isOwner,
  hasEventAccess,
  forcePublicView,
  session,
  guestCookieId
}: {
  eventData: any
  isOwner: boolean
  hasEventAccess: boolean
  forcePublicView: boolean
  session: any
  guestCookieId: string | null
}): Promise<GalleryAccessResult> {
  
  // Determine UI Mode
  const uiMode: UIMode = getUIMode(session, isOwner, hasEventAccess, forcePublicView)
  
  // Determine Content Access
  if (eventData.guestCanViewAlbum === true) {
    // PUBLIC GALLERY - always show ALL content
    const allContent = await getCachedGalleryData(eventData.id, true)
    
    return {
      content: {
        uploads: allContent.uploads,
        pendingUploads: allContent.pendingUploads,
        guestbookEntries: [] // TODO: Add guestbook entries support to getCachedGalleryData
      },
      uiMode,
      showAllContent: true,
      isGuestOwnContent: false
    }
  } else {
    // PRIVATE GALLERY
    if (hasEventAccess && !forcePublicView) {
      // Owner/member normal view - show ALL content
      const allContent = await getCachedGalleryData(eventData.id, true)
      
      return {
        content: {
          uploads: allContent.uploads,
          pendingUploads: allContent.pendingUploads,
          guestbookEntries: [] // TODO: Add guestbook entries support to getCachedGalleryData
        },
        uiMode,
        showAllContent: true,
        isGuestOwnContent: false
      }
    } else {
      // Guest experience - show only own content
      let guestContent: { uploads: any[], guestbookEntries: any[], totalCount: number } = { uploads: [], guestbookEntries: [], totalCount: 0 }
      
      if (guestCookieId) {
        guestContent = await getGuestOwnContent(guestCookieId, eventData.id)
      }
      
      return {
        content: {
          uploads: guestContent.uploads,
          pendingUploads: [], // Guests see all their uploads, regardless of approval
          guestbookEntries: guestContent.guestbookEntries
        },
        uiMode,
        showAllContent: false,
        isGuestOwnContent: true
      }
    }
  }
}

/**
 * Determine which UI mode to use based on user state
 */
function getUIMode(session: any, isOwner: boolean, hasEventAccess: boolean, forcePublicView: boolean): UIMode {
  if (forcePublicView) {
    return 'GUEST_UI' // Always guest UI when forcing public view
  }
  
  if (isOwner) {
    return 'OWNER_UI' // Full owner features
  }
  
  if (session?.user && hasEventAccess) {
    return 'AUTH_UI' // Basic authenticated features  
  }
  
  return 'GUEST_UI' // Anonymous or no access
}
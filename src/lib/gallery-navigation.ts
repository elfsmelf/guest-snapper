/**
 * Gallery navigation utilities to preserve view=public parameter across navigation
 */

/**
 * Get the current view parameter from the URL
 */
export function getViewParam(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('view')
}

/**
 * Build a gallery URL with preserved view parameter
 */
export function buildGalleryUrl(path: string, preserveView = true): string {
  if (!preserveView) return path
  
  const viewParam = getViewParam()
  if (viewParam === 'public') {
    const separator = path.includes('?') ? '&' : '?'
    return `${path}${separator}view=public`
  }
  
  return path
}

/**
 * Navigate to a gallery page preserving the view parameter
 */
export function navigateToGallery(router: any, path: string, preserveView = true) {
  const url = buildGalleryUrl(path, preserveView)
  router.push(url)
  if (path.includes('/gallery/')) {
    router.refresh()
  }
}
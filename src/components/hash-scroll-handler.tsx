"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function HashScrollHandler() {
  const pathname = usePathname()

  useEffect(() => {
    const scrollToHash = (retries = 0) => {
      // Read hash directly from window.location
      const hash = window.location.hash

      if (!hash) return

      // Remove the # symbol
      const id = hash.replace('#', '')
      const element = document.getElementById(id)

      if (element) {
        // Smooth scroll to element
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      } else if (retries < 10) {
        // Retry if element not found yet (handles dynamic content)
        setTimeout(() => scrollToHash(retries + 1), 100)
      }
    }

    // Scroll on initial load and route changes
    scrollToHash()

    // Also handle hash changes within the same page
    const handleHashChange = () => scrollToHash()
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [pathname])

  return null
}

"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

interface DownloadAllButtonProps {
  eventId: string
  fileCount: number
  disabled?: boolean
}

export function DownloadAllButton({ eventId, fileCount, disabled = false }: DownloadAllButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (disabled || fileCount === 0) return

    setIsDownloading(true)
    
    try {
      // Create a link and trigger download
      const downloadUrl = `/api/events/${eventId}/download-all`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = '' // Browser will use filename from Content-Disposition header
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      // Keep loading state for a bit longer as the download might take time to start
      setTimeout(() => setIsDownloading(false), 3000)
    }
  }

  if (disabled || fileCount === 0) {
    return (
      <div className="text-center">
        <Button 
          className="w-full"
          variant="outline"
          disabled
        >
          <Download className="mr-2 h-4 w-4" />
          No files to download
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          No approved files available for download
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <Button 
        onClick={handleDownload}
        className="w-full"
        variant="outline"
        disabled={isDownloading}
      >
        {isDownloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isDownloading ? 'Preparing download...' : `Download ZIP (${fileCount} files)`}
      </Button>
      {isDownloading && (
        <p className="text-xs text-muted-foreground mt-2">
          This may take a moment for large galleries...
        </p>
      )}
    </div>
  )
}
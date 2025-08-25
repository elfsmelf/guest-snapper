"use client"

import { QRCodeGenerator } from './qr-code-generator'
import { markQRDownloaded } from '@/app/actions/quick-start'

interface QRCodeGeneratorClientProps {
  value: string
  eventId: string
  size?: number
}

export function QRCodeGeneratorClient({ value, eventId, size = 192 }: QRCodeGeneratorClientProps) {
  const handleDownload = async () => {
    // Mark QR as downloaded for Quick Start Guide using server action
    await markQRDownloaded(eventId)
  }

  return (
    <QRCodeGenerator 
      value={value}
      eventId={eventId}
      size={size}
      onDownload={handleDownload}
    />
  )
}
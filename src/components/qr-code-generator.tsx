"use client"

import { useRef } from 'react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Download, Printer, FileImage } from 'lucide-react'

interface QRCodeGeneratorProps {
  value: string
  size?: number
}

export function QRCodeGenerator({ value, size = 192 }: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  const downloadSVG = () => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    // Serialize the SVG to string
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    // Trigger download
    const a = document.createElement('a')
    a.href = svgUrl
    a.download = 'gallery-qr-code.svg'
    a.click()
    URL.revokeObjectURL(svgUrl)
  }

  const downloadPNG = () => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    // High-DPI settings
    const downloadSize = 512
    const pixelRatio = window.devicePixelRatio || 1
    const canvasSize = downloadSize * pixelRatio
    const padding = 40 * pixelRatio

    // Serialize SVG
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size with padding and high DPI
      canvas.width = canvasSize + (padding * 2)
      canvas.height = canvasSize + (padding * 2)

      // Scale for high DPI displays
      canvas.style.width = `${downloadSize + (padding * 2 / pixelRatio)}px`
      canvas.style.height = `${downloadSize + (padding * 2 / pixelRatio)}px`

      // Fill white background (quiet zone)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw QR code with padding
      ctx.drawImage(img, padding, padding, canvasSize, canvasSize)

      // Convert to PNG and download
      const dataURL = canvas.toDataURL('image/png', 1.0)
      const a = document.createElement('a')
      a.href = dataURL
      a.download = 'gallery-qr-code.png'
      a.click()

      URL.revokeObjectURL(svgUrl)
    }
    img.src = svgUrl
  }

  const printQRCode = () => {
    if (!qrRef.current) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgHTML = svg.outerHTML
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: white;
            }
            .qr-container {
              text-align: center;
              padding: 40px;
            }
            .qr-container h2 {
              margin-bottom: 20px;
              font-family: Arial, sans-serif;
            }
            svg {
              border: 1px solid #ddd;
              padding: 20px;
              background: white;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>Gallery QR Code</h2>
            ${svgHTML}
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div 
          ref={qrRef}
          className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          <QRCode
            value={value}
            size={size}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={downloadPNG}
        >
          <Download className="mr-2 h-4 w-4" />
          Download PNG
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={downloadSVG}
        >
          <FileImage className="mr-2 h-4 w-4" />
          Download SVG
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          size="sm"
          onClick={printQRCode}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print QR Code
        </Button>
      </div>
    </div>
  )
}
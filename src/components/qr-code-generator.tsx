"use client"

import { useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, Printer, FileImage, Palette } from 'lucide-react'

interface QRCodeGeneratorProps {
  value: string
  size?: number
  eventId?: string
  onDownload?: () => void
}

export function QRCodeGenerator({ value, size = 192, eventId, onDownload }: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [qrColor, setQrColor] = useState('#000000')
  const [isTransparent, setIsTransparent] = useState(false)

  const downloadSVG = () => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    // Clone SVG to avoid modifying the original
    const svgClone = svg.cloneNode(true) as SVGElement

    // Update fill color if it's not the default black
    if (qrColor !== '#000000') {
      const paths = svgClone.querySelectorAll('path[fill="#000000"], path[fill="black"]')
      paths.forEach(path => {
        path.setAttribute('fill', qrColor)
      })
    }

    // Serialize the SVG to string
    const svgData = new XMLSerializer().serializeToString(svgClone)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    // Trigger download
    const a = document.createElement('a')
    a.href = svgUrl
    a.download = 'gallery-qr-code.svg'
    a.click()
    URL.revokeObjectURL(svgUrl)

    // Track download for Quick Start Guide
    if (eventId && onDownload) {
      onDownload()
    }
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

      // Fill background (quiet zone) - only if not transparent
      if (!isTransparent) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Draw QR code with padding
      ctx.drawImage(img, padding, padding, canvasSize, canvasSize)

      // Convert to PNG and download
      const dataURL = canvas.toDataURL('image/png', 1.0)
      const a = document.createElement('a')
      a.href = dataURL
      a.download = 'gallery-qr-code.png'
      a.click()

      URL.revokeObjectURL(svgUrl)
      
      // Track download for Quick Start Guide
      if (eventId && onDownload) {
        onDownload()
      }
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
              background: ${isTransparent ? 'transparent' : 'white'};
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
      {/* Customization Controls */}
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <Label className="text-sm font-medium">Customize QR Code</Label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="qr-color" className="text-sm">QR Code Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="qr-color"
                type="color"
                value={qrColor}
                onChange={(e) => setQrColor(e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{qrColor}</span>
            </div>
          </div>

          {/* Transparency Option */}
          <div className="space-y-2">
            <Label className="text-sm">Background</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="transparent"
                checked={isTransparent}
                onCheckedChange={(checked) => setIsTransparent(checked as boolean)}
              />
              <Label htmlFor="transparent" className="text-sm">
                Transparent background
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Preview */}
      <div className="flex justify-center">
        <div
          ref={qrRef}
          className={`p-4 rounded-lg border border-gray-200 shadow-sm ${
            isTransparent ? 'bg-transparent' : 'bg-white'
          }`}
          style={{
            backgroundImage: isTransparent ?
              'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 20px 20px' :
              undefined
          }}
        >
          <QRCode
            value={value}
            size={size}
            fgColor={qrColor}
            bgColor={isTransparent ? "transparent" : "white"}
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
"use client"

import QRCode from 'react-qr-code'

interface SimpleQRCodeProps {
  value: string
  size?: number
}

export function SimpleQRCode({ value, size = 80 }: SimpleQRCodeProps) {
  return (
    <QRCode
      value={value}
      size={size}
      fgColor="#000000"
      bgColor="white"
      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
    />
  )
}
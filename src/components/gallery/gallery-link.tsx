"use client"

import Link from "next/link"
import { buildGalleryUrl } from "@/lib/gallery-navigation"

interface GalleryLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  preserveView?: boolean
  [key: string]: any
}

export function GalleryLink({ href, children, preserveView = true, ...props }: GalleryLinkProps) {
  const url = buildGalleryUrl(href, preserveView)
  
  return (
    <Link href={url} {...props}>
      {children}
    </Link>
  )
}
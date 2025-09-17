"use client"

import Link from "next/link"

interface GalleryLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}

export function GalleryLink({ href, children, ...props }: GalleryLinkProps) {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}
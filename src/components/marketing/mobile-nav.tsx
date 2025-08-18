"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import type { User } from "better-auth/types"

interface MobileNavProps {
  user: User | null
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden absolute top-16 left-0 right-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 border-b",
          open ? "block" : "hidden"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="grid gap-2">
            <MobileLink href="/how-it-works" onClick={() => setOpen(false)}>
              How It Works
            </MobileLink>

            {/* Features group */}
            <MobileGroup label="Features">
              <MobileLink
                href="/features/qr-photo-sharing"
                onClick={() => setOpen(false)}
              >
                Photo &amp; Video Sharing
              </MobileLink>
              <MobileLink
                href="/features/digital-guestbook"
                onClick={() => setOpen(false)}
              >
                Digital Guestbook
              </MobileLink>
              <MobileLink
                href="/features/real-time-gallery"
                onClick={() => setOpen(false)}
              >
                Real-time Gallery
              </MobileLink>
              <MobileLink href="/features" onClick={() => setOpen(false)}>
                All Features
              </MobileLink>
            </MobileGroup>

            {/* Occasions group */}
            <MobileGroup label="Occasions">
              <MobileLink
                href="/occasions/weddings"
                onClick={() => setOpen(false)}
              >
                Weddings
              </MobileLink>
              <MobileLink
                href="/occasions/birthdays"
                onClick={() => setOpen(false)}
              >
                Birthdays
              </MobileLink>
              <MobileLink
                href="/occasions/corporate"
                onClick={() => setOpen(false)}
              >
                Corporate Events
              </MobileLink>
            </MobileGroup>

            <MobileLink href="/pricing" onClick={() => setOpen(false)}>
              Pricing
            </MobileLink>
            <MobileLink href="/contact" onClick={() => setOpen(false)}>
              Contact
            </MobileLink>

            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="border-t pt-2">
                    <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {user.name || user.email || "Account"}
                    </div>
                    <MobileLink href="/dashboard" onClick={() => setOpen(false)}>
                      Dashboard
                    </MobileLink>
                    <MobileLink href="/auth/settings" onClick={() => setOpen(false)}>
                      Settings
                    </MobileLink>
                    <MobileLink href="/auth/sign-out" onClick={() => setOpen(false)}>
                      Sign Out
                    </MobileLink>
                  </div>
                </>
              ) : (
                <div className="flex gap-3">
                  <Button asChild variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                    <Link href="/auth/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild className="flex-1" onClick={() => setOpen(false)}>
                    <Link href="/auth/sign-up">
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function MobileLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-md px-2 py-2 text-base font-medium text-foreground/90 hover:bg-muted"
    >
      {children}
    </Link>
  )
}

function MobileGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="ml-2 grid gap-1">{children}</div>
    </div>
  )
}
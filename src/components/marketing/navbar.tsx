import Link from "next/link"
import { headers } from "next/headers"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, User } from "lucide-react"
import { auth } from "@/lib/auth"
import { MobileNav } from "./mobile-nav"
import { SignOutButton } from "./sign-out-button"

export async function Navbar() {
  // Server-side authentication check with cache tagging
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  // Mark this component as dynamic for immediate updates on auth changes
  // This ensures the navbar updates immediately when session state changes

  const user = session?.user

  return (
    <header className="border-b bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Home - Guest Snapper"
        >
          <Image
            src="https://assets.guestsnapper.com/marketing/logos/Guest%20Snapper%20v6%20logo.png"
            alt="Guest Snapper"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink href="/how-it-works">How It Works</NavLink>

          {/* Features dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground">
                Features
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuLabel>Features</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/features/qr-photo-sharing">
                  Photo &amp; Video Sharing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/features/digital-guestbook">Digital Guestbook</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/features/real-time-gallery">Real-time Gallery</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/features">All Features</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Occasions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground">
                Occasions
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/occasions/weddings">Weddings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/occasions/birthdays">Birthdays</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/occasions/corporate">Corporate Events</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <User className="h-4 w-4" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user.name || user.email || "My Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutButton />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button asChild variant="secondary" size="sm">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">
                  Get Started
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile nav toggle */}
        <MobileNav user={user || null} />
      </div>
    </header>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  )
}
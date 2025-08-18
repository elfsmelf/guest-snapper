import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export default async function HomePage() {
  // Server-side authentication check
  const session = await auth.api.getSession({
    headers: await headers()
  })

  return (
    <div className="min-h-screen bg-background">
      <main className="relative">
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left: Copy */}
              <div className="relative z-10">
                {/* Trust bar */}
                <div className="mb-4 flex items-center gap-3">
                  <p className="text-sm font-medium text-slate-300">
                    Trusted by 10,000+ Events
                  </p>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className="h-4 w-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>

                <h1 className="text-left text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Easily Collect Photos, Videos & Messages From All Your Guests
                </h1>

                <p className="mt-6 max-w-xl text-left text-slate-200">
                  Create QR codes that let your wedding guests easily share photos and videos. 
                  Build a beautiful digital album with every precious moment from your special day, 
                  all stored securely in one place.
                </p>

                <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
                  <Button asChild size="lg" className="gap-2">
                    <Link href="/auth/sign-up">
                      Get Your Event QR Code
                      <span aria-hidden>→</span>
                    </Link>
                  </Button>

                  <Button asChild size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
                    <Link href="/how-it-works">Explore How It Works</Link>
                  </Button>
                </div>
              </div>

              {/* Right: Hero images */}
              <div className="relative">
                {/* Decorative circles */}
                <div className="pointer-events-none absolute -left-10 -top-8 h-40 w-40 opacity-60">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 blur-xl" />
                </div>
                <div className="pointer-events-none absolute -right-6 top-10 h-32 w-32 opacity-60">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 blur-xl" />
                </div>
                <div className="pointer-events-none absolute -bottom-6 left-6 h-36 w-36 opacity-60">
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-green-400 to-emerald-400 blur-xl" />
                </div>

                {/* Main QR Code visualization */}
                <div className="relative z-10 mx-auto max-w-[720px]">
                  <div className="relative rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-white/10">
                    {/* Mock QR Code */}
                    <div className="mx-auto w-48 h-48 bg-black rounded-lg p-4">
                      <div className="w-full h-full bg-black relative">
                        {/* Simple QR pattern mockup */}
                        <div className="absolute inset-2 bg-white rounded-sm">
                          <div className="grid grid-cols-8 grid-rows-8 gap-px p-2">
                            {Array.from({ length: 64 }).map((_, i) => (
                              <div
                                key={i}
                                className={`aspect-square ${
                                  Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Scan & Share
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Your guests scan this QR code to instantly upload photos and videos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle gradient overlay at bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent" />
        </section>
      </main>
    </div>
  )
}

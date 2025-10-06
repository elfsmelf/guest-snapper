import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

// Force dynamic rendering for auth-dependent layout
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication check
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const user = session?.user

  if (!user) {
    redirect('/auth/sign-in')
  }

  return (
    <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-screen-2xl">
      {children}
    </main>
  )
}
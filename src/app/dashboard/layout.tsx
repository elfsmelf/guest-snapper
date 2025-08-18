import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

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
    <main className="container mx-auto px-4 py-8">
      {children}
    </main>
  )
}
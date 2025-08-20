import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is authenticated and is an admin
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    redirect('/auth/sign-in?redirectTo=/admin')
  }

  // Check if user is admin (by role or email fallback)
  const adminEmails = (process.env.ADMIN_EMAILS || 'support@guestsnapper.com').split(',').map(email => email.trim())
  const isAdminByRole = (session.user as any).role === 'admin'
  const isAdminByEmail = adminEmails.includes(session.user.email)
  
  if (!isAdminByRole && !isAdminByEmail) {
    redirect('/dashboard')
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="sticky top-0 z-40 bg-background border-b px-4 py-2">
          <div className="flex justify-between items-center">
            <SidebarTrigger />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Logged in as: <strong>{session.user.email}</strong>
              </span>
              <a 
                href="/dashboard" 
                className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
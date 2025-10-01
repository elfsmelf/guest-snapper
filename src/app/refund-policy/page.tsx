import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Refund Policy | Guest Snapper",
  description: "Refund Policy for Guest Snapper - Learn about our refund process and terms.",
}

// Force static generation
export const dynamic = 'force-static'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            If you're not satisfied with your purchase, you can request a refund within 30 days of the transaction date. To initiate a refund, please reach out via our <Link href="/contact" className="text-primary hover:underline">Contact page</Link> with your order details. Refunds will be processed within 7 business days. Please note that this policy applies only to initial purchases of the Guest Snapper service.
          </p>
        </div>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | Guest Snapper",
  description: "Privacy Policy for Guest Snapper - Learn how we collect, use, and protect your information.",
}

// Force static generation
export const dynamic = 'force-static'

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated on August 9, 2024, effective as of February 10, 2024
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none">
          <p className="text-foreground leading-relaxed mb-6">
            It is the policy of Guest Snapper to respect your privacy regarding any information we may collect while operating our website. This Privacy Policy applies to Guest Snapper (hereinafter, "us", "we", or "https://guestsnapper.com"). We respect your privacy and are committed to protecting the personally identifiable information you may provide to us through the Website. We have adopted this privacy policy ("Privacy Policy") to explain what information may be collected on our Website, how we use this information, and under what circumstances we may disclose the information to third parties. This Privacy Policy applies only to information we collect through the Website and does not apply to our collection of information from other sources. This Privacy Policy, together with the Terms Of Service posted on our Website, set forth the general rules and policies governing your use of our Website. Depending on your activities when visiting our Website, you may be required to agree to additional terms and conditions.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Website Visitors</h2>
          <p className="text-foreground leading-relaxed mb-6">
            Like most website operators, Guest Snapper collects non-personally-identifying information of the sort that web browsers and servers typically make available, such as the browser type, language preference, referring site, and the date and time of each visitor request. Guest Snapper's purpose in collecting non-personally identifying information is to better understand how Guest Snapper's visitors use its website. From time to time, Guest Snapper may release non-personally-identifying information in the aggregate, e.g., by publishing a report on trends in the usage of its website.
          </p>
          <p className="text-foreground leading-relaxed mb-6">
            Guest Snapper also collects potentially personally-identifying information like Internet Protocol (IP) addresses for logged in users and for users leaving comments on https://guestsnapper.com blog posts. Guest Snapper only discloses logged in user and commenter IP addresses under the same circumstances that it uses and discloses personally-identifying information as described below.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Gathering of Personally-Identifying Information</h2>
          <p className="text-foreground leading-relaxed mb-6">
            Certain visitors to Guest Snapper's websites choose to interact with Guest Snapper in ways that require Guest Snapper to gather personally-identifying information. The amount and type of information that Guest Snapper gathers depends on the nature of the interaction. For example, we ask visitors who sign up for a blog at https://guestsnapper.com to provide a username and email address.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Security</h2>
          <p className="text-foreground leading-relaxed mb-6">
            The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security. To learn more about how we safeguard your data and protect event content, visit our Security & Content Ownership page.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Links To External Sites</h2>
          <p className="text-foreground leading-relaxed mb-6">
            Our Service may contain links to external sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy and terms of service of every site you visit.
          </p>
          <p className="text-foreground leading-relaxed mb-6">
            We have no control over, and assume no responsibility for the content, privacy policies or practices of any third party sites, products or services.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Aggregated Statistics</h2>
          <p className="text-foreground leading-relaxed mb-6">
            Guest Snapper may collect statistics about the behavior of visitors to its website. Guest Snapper may display this information publicly or provide it to others. However, Guest Snapper does not disclose your personally-identifying information.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Cookies</h2>
          <p className="text-foreground leading-relaxed mb-6">
            To enrich and perfect your online experience, Guest Snapper uses "Cookies", similar technologies and services provided by others to display personalized content, appropriate advertising and store your preferences on your computer.
          </p>
          <p className="text-foreground leading-relaxed mb-6">
            A cookie is a string of information that a website stores on a visitor's computer, and that the visitor's browser provides to the website each time the visitor returns. Guest Snapper uses cookies to help Guest Snapper identify and track visitors, their usage of https://guestsnapper.com, and their website access preferences. Guest Snapper visitors who do not wish to have cookies placed on their computers should set their browsers to refuse cookies before using Guest Snapper's websites, with the drawback that certain features of Guest Snapper's websites may not function properly without the aid of cookies.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Privacy Policy Changes</h2>
          <p className="text-foreground leading-relaxed mb-6">
            Although most changes are likely to be minor, Guest Snapper may change its Privacy Policy from time to time, and in Guest Snapper's sole discretion. Guest Snapper encourages visitors to frequently check this page for any changes to its Privacy Policy. Your continued use of this site after any change in this Privacy Policy will constitute your acceptance of such change.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">Contact Information</h2>
          <p className="text-foreground leading-relaxed mb-6">
            If you have any questions, feel free to contact us at{" "}
            <Link href="/contact" className="text-primary hover:underline">
              here
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

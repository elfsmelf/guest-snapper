import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Canva Templates - Guest Snapper",
  description: "Beautiful, ready-to-use templates for your wedding or event. Customize and download instantly.",
}

const templates = [
  {
    id: "i_spy_template_5x7",
    image_url: "https://assets.guestsnapper.com/marketing/gallery/I%20spy.jpg",
    title: "I Spy Table Template / 5x7\"",
    description: "A fun, interactive game for guests to play at their tables, encouraging them to capture memorable moments with their cameras.",
    button_text: "Edit Template",
    canva_url: "https://www.canva.com/design/DAGzroQ9nio/Byg0pR_eUThhPq-t4fVhCw/view?utm_content=DAGzroQ9nio&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview"
  },
  {
    id: "welcome_sign_portrait",
    image_url: "https://assets.guestsnapper.com/marketing/gallery/welcome%20sign.jpg",
    title: "Welcome Sign Portrait | 42 x 59.4 Poster",
    description: "This large, elegant sign is designed to warmly greet your guests as they arrive at the wedding venue.",
    button_text: "Edit Template",
    canva_url: "https://www.canva.com/design/DAGz2uDYSRk/G6eaBSfTCKnKvPE1BdOWog/view?utm_content=DAGz2uDYSRk&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview"
  },
  {
    id: "mini_take_home_cards",
    image_url: "https://assets.guestsnapper.com/marketing/gallery/mini%20take%20home.jpg",
    title: "Mini Take Home Cards / 50 × 85 mm",
    description: "These are small, convenient cards for guests to take home, featuring a QR code to easily access and share wedding photos.",
    button_text: "Edit Template",
    canva_url: "https://www.canva.com/design/DAGz3f_9lfg/yx5Ab_ArdYmQG4kWLQXITA/view?utm_content=DAGz3f_9lfg&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview"
  },
  {
    id: "wedding_table_square_signs",
    image_url: "https://assets.guestsnapper.com/marketing/gallery/square%20table%20signs.jpg",
    title: "Wedding Table Square Signs Template / 140 x 140mm",
    description: "Modern, square signs for your tables that politely ask guests to help capture memories by sharing their photos via a QR code.",
    button_text: "Edit Template",
    canva_url: "https://www.canva.com/design/DAGz3l_K068/GHLeBYmz8sY982qN98ijqQ/view?utm_content=DAGz3l_K068&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview"
  },
  {
    id: "celebrations_i_spy_template",
    image_url: "https://assets.guestsnapper.com/marketing/gallery/celebrations.jpg",
    title: "Celebrations / I Spy Template / 127mm x 177.8mm",
    description: "Engage your guests with this beautifully designed \"I Spy\" game that provides a list of photo moments for them to find and capture throughout the celebration.",
    button_text: "Edit Template",
    canva_url: "https://www.canva.com/design/DAGz8yaMT18/KwkNZcRxHfb3RBy7n4Zp_Q/view?utm_content=DAGz8yaMT18&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview"
  }
]

export default function CanvaTemplatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            Canva Templates
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Beautiful, ready-to-use templates for your wedding or event. Customize and download instantly from Canva.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap justify-center gap-8">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-sm flex flex-col"
            >
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={template.image_url}
                  alt={template.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                    {template.title}
                  </h3>

                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {template.description}
                  </p>
                </div>

                <Button asChild className="w-full mt-auto">
                  <Link
                    href={template.canva_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {template.button_text}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Create Your Event Gallery?
          </h2>
          <p className="text-gray-600 mb-8">
            Download these templates and start collecting memories from your guests today.
          </p>
          <Button asChild size="lg">
            <Link href="/auth/sign-up">
              Get Started Free
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
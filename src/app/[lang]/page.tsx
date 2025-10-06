import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Smartphone, Sparkles, Check, Infinity, X, MapPin } from "lucide-react"
import { PricingSection } from "@/components/pricing-section"
import { ReviewsCarousel } from "@/components/reviews-carousel"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import type { Metadata } from "next"
import { getDictionary, type Locale } from "@/lib/dictionaries"

// Force static generation
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export const metadata: Metadata = {
  title: "Guest Snapper - QR Code Wedding Photo Sharing & Guest Album",
  description: "Create a QR code wedding photo gallery in 60 seconds. Guests scan to upload unlimited photos & videos - no app required. Perfect for weddings, parties & events.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Guest Snapper - QR Code Wedding Photo Sharing",
    description: "Create a QR code wedding photo gallery in 60 seconds. Guests scan to upload unlimited photos & videos - no app required.",
    url: "/",
    images: [
      {
        url: "https://assets.guestsnapper.com/marketing/gallery/hero%20image%20mockup.jpg",
        width: 1200,
        height: 630,
        alt: "Guest Snapper - QR Code Wedding Photo Sharing",
      },
    ],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Guest Snapper',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0',
    highPrice: '299',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.5',
    reviewCount: '2378',
  },
  description: 'Create a QR code wedding photo gallery in 60 seconds. Guests scan to upload unlimited photos & videos - no app required.',
  url: 'https://www.guestsnapper.com',
  image: 'https://assets.guestsnapper.com/marketing/gallery/hero%20image%20mockup.jpg',
  author: {
    '@type': 'Organization',
    name: 'Guest Snapper',
  },
  featureList: [
    'QR Code Photo Sharing',
    'Unlimited Photo & Video Uploads',
    'No App Required',
    'Live Gallery Updates',
    'Custom Templates',
    'Privacy Controls',
    'Download All Photos',
  ],
}

export default async function HomePage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  // Reviews data
  const reviews = [
    { name: "Marcus", location: "Copenhagen, Denmark", rating: 5, text: "Got almost 400 photos from our guests! Amazing to see our day through everyone else's eyes. Photographer loved it too." },
    { name: "Emma", location: "Wellington, NZ", rating: 5, text: "Wish this existed for my sister's wedding last year! Already recommended it to three engaged friends. Game changer!" },
    { name: "Gabriella", location: "Geneva, Switzerland", rating: 5, text: "The design was so clean and elegant. Fit perfectly with our minimalist theme. Guests kept asking where we found it." },
    { name: "Erik", location: "Stockholm, Sweden", rating: 5, text: "Had no idea people could share photos days before the ceremony. Got some sweet getting-ready shots we never would have seen." },
    { name: "Chiara M.", location: "Milan, Italy", rating: 5, text: "Way better than creating a shared album or bothering people for photos later. Everything just appeared automatically." },
    { name: "Liisa", location: "Tallinn, Estonia", rating: 5, text: "Some older relatives needed help at first, but once they scanned it, they went crazy uploading! 200+ photos from them alone." },
    { name: "James K.", location: "Adelaide, AUS", rating: 5, text: "The no-app-required thing was brilliant. Everyone could use it instantly, even my tech-phobic uncle." },
    { name: "Sarah P.", location: "Vancouver, BC", rating: 5, text: "Added this two weeks before the wedding and it was the best last-minute decision we made. So many candid moments captured." },
    { name: "Rachel", location: "Denver, CO", rating: 5, text: "Gave us a completely different perspective on our wedding day. Some of these photos are now our absolute favorites." },
    { name: "Ryan M.", location: "Manchester, UK", rating: 5, text: "Literally just put the card on each table and magic happened. Friends were sharing photos before we even left for the honeymoon." },
    { name: "Lukas", location: "Vienna, Austria", rating: 5, text: "Simple setup, worked flawlessly. Even my 80-year-old grandmother figured it out and uploaded 50 photos! 😊" },
    { name: "Grace L.", location: "Edinburgh, UK", rating: 5, text: "Blown away by how seamless this was. Had 600+ photos by Sunday morning without lifting a finger." },
    { name: "Tyler", location: "Toronto, ON", rating: 4, text: "actually incredible how many pics we got 📸 everyone was just scanning and uploading all night lol" },
    { name: "Carmen R.", location: "Barcelona, Spain", rating: 5, text: "Not every guest participated but those who did gave us pure gold. Some hilarious moments we completely missed." },
    { name: "Jake & Olivia", location: "Portland, OR", rating: 5, text: "Skeptical at first but this ended up being such a highlight. Got to see our wedding through 30 different perspectives." },
    { name: "Sam & Kate", location: "Melbourne, AUS", rating: 5, text: "The morning after was like Christmas - so many surprise photos waiting for us. No awkward \"can you send me pics\" texts needed." },
    { name: "Chris W.", location: "Montreal, QC", rating: 5, text: "Completely forgot about it during the reception and then discovered this treasure trove of photos days later. Mind blown." },
  ]

  return (
    <div className="min-h-screen">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="relative">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background">
          <div className="container mx-auto px-4 md:px-6 py-16 lg:py-24">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              {/* Left: Content */}
              <div className="relative z-10">
                <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-foreground font-serif">
                  {dict.home.hero.title}
                </h1>

                <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                  {dict.home.hero.description}
                </p>

                {/* CTA Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-12 py-6 text-xl rounded-full"
                  >
                    <Link href={`/${lang}/auth/sign-in`}>
                      {dict.home.hero.ctaTryFree}
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-muted-foreground/20 bg-background text-foreground hover:bg-muted font-semibold px-12 py-6 text-xl rounded-full"
                  >
                    <a href="#how-it-works">
                      {dict.home.hero.ctaHowItWorks}
                    </a>
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-12 flex flex-wrap items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{dict.home.hero.trust.fiveStarRated}</span>
                  </div>

                  <div className="w-px h-4 bg-muted-foreground/30" />

                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">{dict.home.hero.trust.eventsCount}</span>
                  </div>

                  <div className="w-px h-4 bg-muted-foreground/30" />

                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm font-medium">{dict.home.hero.trust.noAppRequired}</span>
                  </div>
                </div>
              </div>

              {/* Right: Hero Image */}
              <div className="relative lg:h-[600px] flex items-center justify-center">
                <div className="relative">
                  <Image
                    src="https://assets.guestsnapper.com/marketing/gallery/hero%20image%20mockup.jpg"
                    alt="Hero image mockup showing QR code photo sharing in action"
                    width={600}
                    height={600}
                    className="relative z-10 max-w-full h-auto rounded-xl shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            {/* Header Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance font-serif">{dict.home.howItWorks.title}</h1>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance font-serif">
                {dict.home.howItWorks.subtitle}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty whitespace-pre-line">
                {dict.home.howItWorks.description}
              </p>
            </div>

            {/* Steps Section */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* Step 1 */}
              <Card className="relative overflow-hidden border-2 border-border flex flex-col">
                <div className="absolute top-4 left-4 w-12 h-12 bg-secondary rounded-full flex items-center justify-center border-4 border-background z-10">
                  <span className="text-2xl font-bold text-secondary-foreground">1</span>
                </div>
                <CardContent className="p-8 pt-12 flex flex-col flex-1">
                  <div className="space-y-4 mb-6 flex-shrink-0">
                    <div className="rounded-2xl min-h-[150px] overflow-hidden">
                      <img
                        src="https://assets.guestsnapper.com/marketing/heroes/create%20new%20event.png"
                        alt="Create new event interface"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="rounded-2xl min-h-[150px] overflow-hidden">
                      <img
                        src="https://assets.guestsnapper.com/marketing/gallery/privacy%20settings.png"
                        alt="Privacy settings interface"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-4 font-serif">{dict.home.howItWorks.step1.title}</h3>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{dict.home.howItWorks.step1.feature1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{dict.home.howItWorks.step1.feature2}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <span className="text-primary">⚡</span>
                    <span>{dict.home.howItWorks.step1.avgTime}</span>
                  </div>

                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto">
                    <Link href={`/${lang}/auth/sign-in`}>{dict.home.howItWorks.step1.cta}</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="relative overflow-hidden border-2 border-border flex flex-col">
                <div className="absolute top-4 left-4 w-12 h-12 bg-secondary rounded-full flex items-center justify-center border-4 border-background z-10">
                  <span className="text-2xl font-bold text-secondary-foreground">2</span>
                </div>
                <CardContent className="p-8 pt-12 flex flex-col flex-1">
                  <div className="rounded-2xl mb-6 min-h-[328px] overflow-hidden flex-shrink-0">
                    <img
                      src="https://assets.guestsnapper.com/marketing/gallery/welcome%20sign.jpg"
                      alt="Wedding welcome sign with QR code"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-4 font-serif">{dict.home.howItWorks.step2.title}</h3>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{dict.home.howItWorks.step2.feature1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{dict.home.howItWorks.step2.feature2}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <span className="text-foreground">📱</span>
                    <span>{dict.home.howItWorks.step2.works}</span>
                  </div>

                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto">
                    <Link href={`/${lang}/auth/sign-in`}>{dict.home.howItWorks.step2.cta}</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="relative overflow-hidden border-2 border-border flex flex-col">
                <div className="absolute top-4 left-4 w-12 h-12 bg-secondary rounded-full flex items-center justify-center border-4 border-background z-10">
                  <span className="text-2xl font-bold text-secondary-foreground">3</span>
                </div>
                <CardContent className="p-8 pt-12 flex flex-col flex-1">
                  <div className="rounded-2xl mb-6 min-h-[328px] overflow-hidden flex-shrink-0">
                    <img
                      src="https://assets.guestsnapper.com/marketing/gallery/wedding%20gallery.png"
                      alt="Wedding photo gallery interface"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-4 font-serif whitespace-pre-line">{dict.home.howItWorks.step3.title}</h3>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{dict.home.howItWorks.step3.feature1}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{dict.home.howItWorks.step3.feature2}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Infinity className="w-4 h-4" />
                    <span>{dict.home.howItWorks.step3.unlimited}</span>
                  </div>

                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto">
                    <Link href={`/${lang}/auth/sign-in`}>{dict.home.howItWorks.step3.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-16 bg-gradient-to-br from-secondary/5 to-accent/5">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
                {dict.home.reviews.title}
              </h2>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <Star className="h-5 w-5 fill-yellow-400/50 text-yellow-400" />
                </div>
                <span className="text-lg font-medium">{dict.home.reviews.rating}</span>
                <span className="text-muted-foreground">({dict.home.reviews.count})</span>
              </div>
            </div>

            {/* Reviews Carousel */}
            <div className="max-w-6xl mx-auto">
              <ReviewsCarousel reviews={reviews} />
            </div>

            {/* CTA Button */}
            <div className="text-center mt-12">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl rounded-full font-semibold">
                <Link href={`/${lang}/auth/sign-in`}>
                  {dict.home.comparison.cta}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stunning Templates Section */}
        <section className="py-16 bg-gradient-to-br from-secondary/5 to-accent/5">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
                {dict.home.templates.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {dict.home.templates.description}
              </p>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
              {/* Welcome Sign Template */}
              <div className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/5] relative overflow-hidden">
                  <Image
                    src="https://assets.guestsnapper.com/marketing/gallery/welcome%20sign.jpg"
                    alt="Welcome Sign Portrait Template"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">Welcome Sign</h3>
                  <p className="text-sm text-muted-foreground">Elegant entrance display</p>
                </div>
              </div>

              {/* Table Signs Template */}
              <div className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/5] relative overflow-hidden">
                  <Image
                    src="https://assets.guestsnapper.com/marketing/gallery/square%20table%20signs.jpg"
                    alt="Wedding Table Square Signs Template"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">Table Signs</h3>
                  <p className="text-sm text-muted-foreground">Modern table displays</p>
                </div>
              </div>

              {/* I Spy Template */}
              <div className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/5] relative overflow-hidden">
                  <Image
                    src="https://assets.guestsnapper.com/marketing/gallery/I%20spy.jpg"
                    alt="I Spy Table Template"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">I Spy Game</h3>
                  <p className="text-sm text-muted-foreground">Interactive guest activity</p>
                </div>
              </div>

              {/* Take Home Cards Template */}
              <div className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/5] relative overflow-hidden">
                  <Image
                    src="https://assets.guestsnapper.com/marketing/gallery/mini%20take%20home.jpg"
                    alt="Mini Take Home Cards Template"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">Take Home Cards</h3>
                  <p className="text-sm text-muted-foreground">Convenient keepsakes</p>
                </div>
              </div>

              {/* Celebrations Template */}
              <div className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/5] relative overflow-hidden">
                  <Image
                    src="https://assets.guestsnapper.com/marketing/gallery/celebrations.jpg"
                    alt="Celebrations I Spy Template"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">Celebrations</h3>
                  <p className="text-sm text-muted-foreground">Festive photo prompts</p>
                </div>
              </div>

            </div>

            {/* CTA */}
            <div className="text-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl rounded-full font-semibold">
                <Link href={`/${lang}/auth/sign-in`}>
                  {dict.home.templates.cta}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
                {dict.home.comparison.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {dict.home.comparison.description}
              </p>
            </div>

            {/* Comparison Table */}
            <div className="max-w-5xl mx-auto overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] md:w-[300px] text-muted-foreground font-semibold">FEATURE</TableHead>
                    <TableHead className="text-center font-semibold">{dict.home.comparison.guestSnapper.toUpperCase()}</TableHead>
                    <TableHead className="text-center font-semibold">{dict.home.comparison.otherServices.toUpperCase()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">{dict.home.comparison.features.guests}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">{dict.home.comparison.values.unlimited.toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>{dict.home.comparison.values.limited2050}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{dict.home.comparison.features.photos}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">{dict.home.comparison.values.unlimitedPhotos.toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>{dict.home.comparison.values.photoLimit}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">{dict.home.comparison.features.quality}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">{dict.home.comparison.values.fullHD}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>{dict.home.comparison.values.compressed}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{dict.home.comparison.features.upload}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">{dict.home.comparison.values.batchUpload}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>{dict.home.comparison.values.singleUpload}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">{dict.home.comparison.features.updates}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">{dict.home.comparison.values.instantUpdates}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>{dict.home.comparison.values.manualRefresh}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{dict.home.comparison.features.storage}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">{dict.home.comparison.values.oneYear}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>{dict.home.comparison.values.shortTerm}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">{dict.home.comparison.features.experience}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">{dict.home.comparison.values.noSignup}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>{dict.home.comparison.values.registration}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{dict.home.comparison.features.qr}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">{dict.home.comparison.values.freeTemplates}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>{dict.home.comparison.values.diy}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">{dict.home.comparison.features.slideshow}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">{dict.home.comparison.values.builtIn}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>{dict.home.comparison.values.premium}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl rounded-full font-semibold">
                <Link href={`/${lang}/auth/sign-in`}>
                  {dict.home.comparison.cta}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* FAQ Section */}
        <section id="faq" className="py-16 pb-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
                  {dict.home.faq.title}
                </h2>
              </div>

              {/* FAQ Accordion */}
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q1.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q1.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q2.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q2.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q3.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q3.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q4.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q4.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q5.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q5.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q6.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q6.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q7.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q7.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q8.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q8.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q9.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q9.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q10.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q10.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-11" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q11.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q11.answer}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-12" className="border rounded-lg px-6 !border-b">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{dict.home.faq.q12.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {dict.home.faq.q12.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-muted/30 border-t">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Logo and Brand */}
              <div className="md:col-span-1">
                <Link href="/" className="inline-block mb-4">
                  <Image
                    src="https://assets.guestsnapper.com/marketing/logos/Guest%20Snapper%20v6%20logo.png"
                    alt="Guest Snapper"
                    width={156}
                    height={42}
                    className="h-10 w-auto"
                  />
                </Link>
              </div>

              {/* Company Links */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">{dict.home.footer.company}</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                      {dict.home.footer.howItWorks}
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                      {dict.home.footer.faq}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">{dict.home.footer.support}</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href={`/${lang}/contact`} className="text-muted-foreground hover:text-foreground transition-colors">
                      {dict.home.footer.contact}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${lang}/refund-policy`} className="text-muted-foreground hover:text-foreground transition-colors">
                      {dict.home.footer.refundPolicy}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* App Links */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">{dict.home.footer.app}</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href={`/${lang}/auth/sign-in`} className="text-muted-foreground hover:text-foreground transition-colors">
                      {dict.home.footer.login}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${lang}/privacy`} className="text-muted-foreground hover:text-foreground transition-colors">
                      {dict.home.footer.privacyPolicy}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${lang}/terms`} className="text-muted-foreground hover:text-foreground transition-colors">
                      {dict.home.footer.termsOfService}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-8 border-t text-center">
              <p className="text-sm text-muted-foreground">
                {dict.home.footer.copyright}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

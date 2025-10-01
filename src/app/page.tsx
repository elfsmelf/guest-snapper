import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Smartphone, Sparkles, Check, Infinity, X, MapPin } from "lucide-react"
import { PricingSection } from "@/components/pricing-section"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Force static generation
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour

export default async function HomePage() {

  return (
    <div className="min-h-screen">
      <main className="relative">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background">
          <div className="container mx-auto px-6 py-16 lg:py-24">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              {/* Left: Content */}
              <div className="relative z-10">
                <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-foreground font-serif">
                  Never miss a moment from your special day!
                </h1>

                <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                  The simple QR-album that captures it all. Guests scan once to upload unlimited photos & videos straight to your collection.
                </p>

                {/* CTA Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-12 py-6 text-xl rounded-full"
                  >
                    <Link href="/auth/sign-in">
                      Try For Free
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-muted-foreground/20 bg-background text-foreground hover:bg-muted font-semibold px-12 py-6 text-xl rounded-full"
                  >
                    <a href="#how-it-works">
                      How It Works
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
                    <span className="text-sm font-medium">5 Star Rated</span>
                  </div>

                  <div className="w-px h-4 bg-muted-foreground/30" />

                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">10k+ Events</span>
                  </div>

                  <div className="w-px h-4 bg-muted-foreground/30" />

                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm font-medium">No App Required</span>
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
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance font-serif">How Guest Snapper Works</h1>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance font-serif">
                Create Your Event QR in 3 Steps
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Guests scan a QR code to share photos, videos, and messages.
                <br />
                No app or signup, all in one digital album.
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

                  <h3 className="text-2xl font-bold text-foreground mb-4 font-serif">Create your event</h3>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">Generate a unique QR & link in seconds</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">Set album visibility, approvals, and download options</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <span className="text-primary">⚡</span>
                    <span>Avg setup time: 58 seconds</span>
                  </div>

                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto">
                    <Link href="/auth/sign-in">Create Your QR</Link>
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

                  <h3 className="text-2xl font-bold text-foreground mb-4 font-serif">Share the QR</h3>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">Print cards or show on TV/projector</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">Share the link in WhatsApp / iMessage / SMS</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <span className="text-foreground">📱</span>
                    <span>Works on any phone - no app required</span>
                  </div>

                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto">
                    <Link href="/auth/sign-in">Free Templates</Link>
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

                  <h3 className="text-2xl font-bold text-foreground mb-2 font-serif">Everything appears in</h3>
                  <h3 className="text-2xl font-bold text-foreground mb-4 font-serif">your live album</h3>

                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">Approve/hide uploads, run a live slideshow</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">Download originals anytime (one-click export)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Infinity className="w-4 h-4" />
                    <span>Unlimited uploads included</span>
                  </div>

                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-auto">
                    <Link href="/auth/sign-in">Demo Event</Link>
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
                Capturing memories at 6000+ weddings this year
              </h2>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="flex">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <Star className="h-5 w-5 fill-yellow-400/50 text-yellow-400" />
                </div>
                <span className="text-lg font-medium">4.5</span>
                <span className="text-muted-foreground">(2378 reviews)</span>
              </div>
            </div>

            {/* Reviews Carousel */}
            <div className="max-w-6xl mx-auto">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {/* Review 1 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Marcus</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Copenhagen, Denmark
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Got almost 400 photos from our guests! Amazing to see our day through everyone else's eyes. Photographer loved it too.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 2 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Emma</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Wellington, NZ
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Wish this existed for my sister's wedding last year! Already recommended it to three engaged friends. Game changer!
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 3 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Gabriella</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Geneva, Switzerland
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          The design was so clean and elegant. Fit perfectly with our minimalist theme. Guests kept asking where we found it.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 4 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Erik</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Stockholm, Sweden
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Had no idea people could share photos days before the ceremony. Got some sweet getting-ready shots we never would have seen.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 5 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Chiara M.</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Milan, Italy
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Way better than creating a shared album or bothering people for photos later. Everything just appeared automatically.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 6 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Liisa</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Tallinn, Estonia
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Some older relatives needed help at first, but once they scanned it, they went crazy uploading! 200+ photos from them alone.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 7 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">James K.</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Adelaide, AUS
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          The no-app-required thing was brilliant. Everyone could use it instantly, even my tech-phobic uncle.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 8 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Sarah P.</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Vancouver, BC
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Added this two weeks before the wedding and it was the best last-minute decision we made. So many candid moments captured.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 9 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Rachel</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Denver, CO
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Gave us a completely different perspective on our wedding day. Some of these photos are now our absolute favorites.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 10 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Ryan M.</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Manchester, UK
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Literally just put the card on each table and magic happened. Friends were sharing photos before we even left for the honeymoon.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 11 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Lukas</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Vienna, Austria
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Simple setup, worked flawlessly. Even my 80-year-old grandmother figured it out and uploaded 50 photos! 😊
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 12 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Grace L.</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Edinburgh, UK
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Blown away by how seamless this was. Had 600+ photos by Sunday morning without lifting a finger.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 13 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Tyler</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Toronto, ON
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(4)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          actually incredible how many pics we got 📸 everyone was just scanning and uploading all night lol
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 14 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Carmen R.</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Barcelona, Spain
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Not every guest participated but those who did gave us pure gold. Some hilarious moments we completely missed.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 15 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Jake & Olivia</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Portland, OR
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Skeptical at first but this ended up being such a highlight. Got to see our wedding through 30 different perspectives.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 16 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Sam & Kate</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Melbourne, AUS
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          The morning after was like Christmas - so many surprise photos waiting for us. No awkward "can you send me pics" texts needed.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>

                  {/* Review 17 */}
                  <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="font-semibold">Chris W.</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Montreal, QC
                          </div>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Completely forgot about it during the reception and then discovered this treasure trove of photos days later. Mind blown.
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>

            {/* CTA Button */}
            <div className="text-center mt-12">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl rounded-full font-semibold">
                <Link href="/auth/sign-in">
                  Start Your Free Event
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
                Stunning Templates for Your Special Day
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose from our curated collection of beautiful, customizable designs. Perfect for any wedding theme or style.
              </p>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-5 gap-6 mb-12">
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
                <Link href="/auth/sign-in">
                  View All Templates
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
                Why Choose Guest Snapper?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how we compare to other photo sharing services. We're built specifically for weddings and events.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="max-w-5xl mx-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px] text-muted-foreground font-semibold">FEATURE</TableHead>
                    <TableHead className="text-center font-semibold">GUEST SNAPPER</TableHead>
                    <TableHead className="text-center font-semibold">OTHER SERVICES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">Number of Guests</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">UNLIMITED</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>Limited to 20-50 users</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Number of Photos</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">UNLIMITED</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>500-1000 photo limit</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">Photo & Video Quality</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">Full HD Photos & 4K Videos</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>Compressed photos, no video support</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Upload Experience</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">Batch Upload, No App Required</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>Single uploads, app downloads needed</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">Real-time Gallery Updates</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">Instant Live Updates</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>Manual refresh required</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Storage & Download Period</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">1 Year Storage</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>30-90 days then pay extra</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">Guest Experience</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">No Sign-up, Just Scan & Upload</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>Email/app registration required</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">QR Code & Templates</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">Free QR Codes & Print Templates</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>DIY setup or pay extra</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">Live Slideshow Display</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-5 w-5" />
                        <span className="font-bold">Built-in Presentation Mode</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span>Premium add-on feature</span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-xl rounded-full font-semibold">
                <Link href="/auth/sign-in">
                  Start Your Free Event
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* FAQ Section */}
        <section className="py-16 pb-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
                  Frequently Asked Questions
                </h2>
              </div>

              {/* FAQ Accordion */}
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">How do guests upload photos?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Guests simply scan your unique wedding QR code or click your share link to upload photos directly from their phones – no app required!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">Can I download all the photos?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Yes! Download all photos and videos in full, original quality whenever you want.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">How long do you keep my photos and videos?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Your memories are safely stored for 12 months, giving you plenty of time to download and share them. Need more time? Just contact us and we'll help extend your storage.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">Can guests upload videos too?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Absolutely! Guests can upload videos in full quality, capturing every speech, dance, and special moment without any compression.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">How do guests find my photo album?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Share your invitation link ahead of time or display the QR code at your venue. Guests can join instantly by scanning the code or clicking the link – it's that simple!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">Do I need to use a QR code?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Not at all! You can share just the link if you prefer. The QR code is simply an easy option for guests to access your gallery at the venue.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">How do you protect our privacy?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Your privacy is our priority. You control who can see uploaded content with configurable settings, so your wedding memories are shared exactly how you want.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">Can I organize photos into separate galleries?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Yes! Create multiple galleries for different events like the ceremony, reception, or rehearsal dinner. Each gets its own QR code for easy organization and targeted sharing.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">How do I get my QR code?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Download your QR code instantly from your Guest Snapper account after purchase. We provide elegant print-ready templates, plus our designer can create custom materials like table cards or TV graphics that match your wedding theme – at no extra cost!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">Do guests need to download an app?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    No downloads or sign-ups required for guests! Everything works through any web browser. Only you need to create an account, making it effortless for everyone to participate.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-11" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">Do you provide design templates?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Absolutely! Choose from our collection of elegant, print-ready templates for banners, cards, table displays, and digital screens. Want something custom? Our designer will create personalized materials that perfectly match your wedding style.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-12" className="border rounded-lg px-6 !border-b">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">How can I get help if needed?</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    Our support team is ready to assist! Use our contact form to reach us, and we'll make sure your Guest Snapper experience is seamless and stress-free.
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
                <h3 className="font-semibold text-foreground mb-4">Guest Snapper</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                      How it works
                    </Link>
                  </li>
                  <li>
                    <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support Links */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Support</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                      Refund policy
                    </Link>
                  </li>
                </ul>
              </div>

              {/* App Links */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">App</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/auth/sign-in" className="text-muted-foreground hover:text-foreground transition-colors">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-8 border-t text-center">
              <p className="text-sm text-muted-foreground">
                © 2025 Guest Snapper. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

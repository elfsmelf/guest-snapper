"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MarketingAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing Assets</h1>
        <p className="text-muted-foreground">
          Manage marketing images and media assets stored in your R2 bucket
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Content Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This page will help you manage marketing assets in your R2 bucket under the marketing/ folder.
          </p>
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Available Categories:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Heroes - Hero section images</li>
              <li>Features - Feature showcase images</li>
              <li>Testimonials - Customer testimonial images</li>
              <li>Gallery - Sample gallery images</li>
              <li>Logos - Brand logos and partners</li>
              <li>Social - Social media graphics</li>
              <li>Email - Email marketing images</li>
              <li>Ads - Advertisement banners</li>
              <li>Misc - Miscellaneous marketing assets</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>R2 Bucket Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <div>wedding-gallery-media/</div>
            <div>├── events/</div>
            <div>│   └── {'{eventId}'}/</div>
            <div>│       ├── media/     (existing user uploads)</div>
            <div>│       └── cover/     (existing cover images)</div>
            <div>└── marketing/     (NEW)</div>
            <div>    ├── heroes/</div>
            <div>    ├── features/</div>
            <div>    ├── testimonials/</div>
            <div>    ├── gallery/</div>
            <div>    ├── logos/</div>
            <div>    ├── social/</div>
            <div>    ├── email/</div>
            <div>    ├── ads/</div>
            <div>    └── misc/</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
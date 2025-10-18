import posthog from "posthog-js"

// Check if running on localhost
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.includes('localhost'));

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: '2025-05-24',
  capture_exceptions: true, // This enables capturing exceptions using Error Tracking, set to false if you don't want this
  debug: process.env.NODE_ENV === "development",
  // Disable tracking on localhost to prevent polluting production data
  opt_out_capturing_by_default: isLocalhost,
  // Persistence configuration for OAuth tracking continuity
  persistence: 'localStorage+cookie', // Most resilient persistence method
  cross_subdomain_cookie: true, // Persist across subdomains
  secure_cookie: true, // Use secure cookies in production
  loaded: (posthog) => {
    if (isLocalhost) {
      console.log('PostHog: Tracking disabled on localhost')
    }
  }
});

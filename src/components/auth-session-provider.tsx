// Better Auth session management
// According to the docs, useSession should be used directly from authClient
// and not wrapped in a custom provider to avoid breaking the nanostore implementation

export { authClient } from '@/lib/auth-client'

// Re-export for convenience - components should use authClient.useSession() directly
// This follows the Better Auth documentation exactly
/**
 * Better Auth Session Optimization Notes
 * 
 * Better Auth already provides optimized session management with:
 * 1. Built-in cookie cache (enabled in auth config)
 * 2. Nanostore-based reactivity that prevents unnecessary requests
 * 3. Automatic session synchronization across tabs/windows
 * 
 * Use authClient.useSession() directly - no additional caching needed.
 */

// This file is kept for reference but Better Auth handles session optimization internally
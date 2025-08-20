import type { authClient } from "@/lib/auth-client"
import type { auth } from "@/lib/auth"

// Infer types from the auth client
export type Session = typeof authClient.$Infer.Session
export type User = Session['user']

// Infer types from the server
export type ServerSession = typeof auth.$Infer.Session
export type ServerUser = ServerSession['user']

// Auth client with proper typing
export type AuthClient = typeof authClient
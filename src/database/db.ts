import { drizzle } from "drizzle-orm/neon-serverless"

export const db = drizzle(process.env.DATABASE_URL!, {
  // Logging disabled for cleaner console output
  // logger: process.env.NODE_ENV === 'development' ? console : false
})

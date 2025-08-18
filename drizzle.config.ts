import "dotenv/config"
import { config } from "dotenv"

config({ path: ".env.local" })
import { defineConfig } from "drizzle-kit"

export default defineConfig({
    out: "./migrations",
    schema: "./src/database/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
})

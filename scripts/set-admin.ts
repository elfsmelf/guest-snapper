import { db } from '../src/database/db'
import { users } from '../src/database/schema'
import { eq } from 'drizzle-orm'

async function setAdmin() {
  const email = process.argv[2]

  if (!email) {
    console.error('Usage: tsx scripts/set-admin.ts <email>')
    process.exit(1)
  }

  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user.length) {
      console.error(`❌ User not found: ${email}`)
      process.exit(1)
    }

    if (user[0].role === 'admin') {
      console.log(`✅ User ${email} is already an admin`)
      process.exit(0)
    }

    await db.update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, email))

    console.log(`✅ Successfully set admin role for: ${email}`)
    console.log(`User ID: ${user[0].id}`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

setAdmin()
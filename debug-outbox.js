const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { outbox } = require('./dist/database/schema.js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function checkOutbox() {
  try {
    const entries = await db.select().from(outbox).orderBy(outbox.sequenceId).limit(10);
    console.log('Outbox entries:', JSON.stringify(entries, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkOutbox();
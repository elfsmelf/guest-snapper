#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function applyRealtimeMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable not found.')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('Applying real-time tables migration...')
    
    const sqlFile = path.join(__dirname, '..', 'migrations', '0004_realtime_tables_only.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    await pool.query(sql)
    
    console.log('✅ Real-time tables migration applied successfully!')
    console.log('Tables created/verified:')
    console.log('  - outbox (for event sourcing)')
    console.log('  - nodes (for distributed locking)')
    console.log('  - outbox_notify trigger function')
    console.log('  - performance indexes')
    
  } catch (error) {
    console.error('❌ Failed to apply migration:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

applyRealtimeMigration()
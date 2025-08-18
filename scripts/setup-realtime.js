#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function setupRealtimeTables() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable not found.')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('Setting up real-time tables for Ably LiveSync...')
    
    const sqlFile = path.join(__dirname, 'init-realtime-tables.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    await pool.query(sql)
    
    console.log('✅ Real-time tables setup completed successfully!')
    console.log('Tables created:')
    console.log('  - outbox (for event sourcing)')
    console.log('  - nodes (for distributed locking)')
    console.log('  - outbox_notify trigger function')
    
  } catch (error) {
    console.error('❌ Failed to setup real-time tables:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupRealtimeTables()
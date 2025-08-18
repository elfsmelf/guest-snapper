import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasAblyKey: !!process.env.NEXT_PUBLIC_ABLY_API_KEY,
    keyPrefix: process.env.NEXT_PUBLIC_ABLY_API_KEY?.substring(0, 10),
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('ABLY'))
  })
}
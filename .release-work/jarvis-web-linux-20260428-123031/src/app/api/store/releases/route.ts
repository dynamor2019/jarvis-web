import { NextResponse } from 'next/server'

const releases: Record<string, string[]> = {
  'core-write': ['1.0.0', '1.0.1', '1.1.0'],
}

export async function GET() {
  if (process.env.STORE_UPDATES_ENABLED !== '1') return NextResponse.json({ success: false, error: 'updates_disabled' }, { status: 404 })
  return NextResponse.json({ success: true, releases })
}

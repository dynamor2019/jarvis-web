import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'jarvis-nextjs-gateway',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
}

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'LaTeX rendering service not configured on server' },
    { status: 501 }
  );
}

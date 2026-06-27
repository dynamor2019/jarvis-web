import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { feature, detail } = await request.json();

    if (!feature) {
      return NextResponse.json({ error: 'Feature is required' }, { status: 400 });
    }

    // Create usage record
    // tokens and cost are 0 as this is a habit tracking record
    await prisma.usageRecord.create({
      data: {
        userId: decoded.userId,
        operation: feature,
        model: detail || 'desktop_client',
        tokens: 0,
        cost: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Record usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

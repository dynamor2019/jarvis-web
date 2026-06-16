import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ackUserSyncTasks } from '@/lib/userSyncQueue';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: '登录失效' }, { status: 401 });
    }

    const body = await request.json();
    const taskIds = Array.isArray(body?.taskIds) ? body.taskIds.filter((id: unknown) => typeof id === 'string') : [];
    if (!taskIds.length) {
      return NextResponse.json({ success: false, error: 'taskIds 不能为空' }, { status: 400 });
    }

    const acked = await ackUserSyncTasks(payload.userId, taskIds);
    return NextResponse.json({ success: true, acked });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '确认同步任务失败' },
      { status: 500 }
    );
  }
}

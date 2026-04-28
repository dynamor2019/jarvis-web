import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { pullPendingUserSyncTasks } from '@/lib/userSyncQueue';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: '登录失效' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 20);
    const tasks = await pullPendingUserSyncTasks(payload.userId, limit);

    return NextResponse.json({
      success: true,
      tasks: tasks.map((task) => ({
        id: task.id,
        eventType: task.eventType,
        payload: JSON.parse(task.payload),
        createdAt: task.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '拉取同步任务失败' },
      { status: 500 }
    );
  }
}

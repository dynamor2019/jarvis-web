import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - 投票/取消投票
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await request.json();
    const { id: requestId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      );
    }

    // 检查是否已投票
    const existingVote = await prisma.featureVote.findUnique({
      where: {
        userId_requestId: {
          userId,
          requestId,
        },
      },
    });

    if (existingVote) {
      // 取消投票
      await prisma.$transaction([
        prisma.featureVote.delete({
          where: { id: existingVote.id },
        }),
        prisma.featureRequest.update({
          where: { id: requestId },
          data: {
            upvotes: {
              decrement: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        action: 'unvoted',
        message: '已取消投票',
      });
    } else {
      // 投票
      await prisma.$transaction([
        prisma.featureVote.create({
          data: {
            userId,
            requestId,
          },
        }),
        prisma.featureRequest.update({
          where: { id: requestId },
          data: {
            upvotes: {
              increment: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        action: 'voted',
        message: '投票成功',
      });
    }
  } catch (error: unknown) {
    console.error('投票失败:', error);
    const message = error instanceof Error ? error.message : '服务器错误';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

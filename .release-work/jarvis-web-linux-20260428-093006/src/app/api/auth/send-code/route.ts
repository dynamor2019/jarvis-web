import { NextRequest, NextResponse } from 'next/server';
import { saveCode } from '@/lib/verificationStore';
import { sendMail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await saveCode(email, code);

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111;">
        <h2 style="margin:0 0 12px;">JarvisAI 验证码</h2>
        <p style="margin:0 0 8px;">您的验证码为：</p>
        <div style="font-size:24px; font-weight:bold; letter-spacing:6px; padding:12px 16px; background:#f3f4f6; border-radius:8px; display:inline-block;">${code}</div>
        <p style="margin:12px 0 0; color:#555;">该验证码 5 分钟内有效，请勿泄露。</p>
      </div>
    `;

    const mailRes = await sendMail({
      to: email,
      subject: 'JarvisAI 验证码',
      html,
      text: `JarvisAI 验证码：${code}（5分钟内有效）`,
    });

    if (!mailRes.ok) {
      const isDebug = process.env.NODE_ENV !== 'production' || process.env.MAIL_DEBUG === '1';
      return NextResponse.json(
        {
          error: '验证码发送失败，请检查邮件服务配置',
          ...(isDebug ? { detail: mailRes.error, mail: mailRes } : {}),
        },
        { status: 500 }
      );
    }

    const isDebug = process.env.NODE_ENV !== 'production' || process.env.MAIL_DEBUG === '1';
    return NextResponse.json({
      message: '验证码已发送',
      ...(isDebug ? { debugCode: code, mail: mailRes } : {}),
    });
  } catch {
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}

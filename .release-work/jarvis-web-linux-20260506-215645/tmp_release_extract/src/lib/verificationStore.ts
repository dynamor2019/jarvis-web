import { prisma } from '@/lib/prisma';

// 数据库验证码存储 (生产环境可用)
// 使用 Prisma VerificationCode 表

export async function saveCode(email: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效
    
    try {
        await prisma.verificationCode.upsert({
            where: { email },
            update: { code, expiresAt },
            create: { email, code, expiresAt },
        });
    } catch (error) {
        
    }
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
    try {
        
        const record = await prisma.verificationCode.findUnique({
            where: { email },
        });
        

        if (!record) return false;

        // 检查过期
        if (new Date() > record.expiresAt) {
            
            await prisma.verificationCode.delete({ where: { email } });
            return false;
        }

        // 检查验证码
        if (record.code !== code) {
            
            return false;
        }

        // 验证成功后删除，防止重放
        await prisma.verificationCode.delete({ where: { email } });
        
        return true;
    } catch (error) {
        
        return false;
    }
}

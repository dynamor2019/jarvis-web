import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { StoreRepo } from '@/lib/storeRepo';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

// 模拟安装进度存储
const installProgress = new Map<string, {
  status: 'downloading' | 'scanning' | 'installing' | 'completed' | 'failed';
  progress: number;
  message: string;
  startTime: number;
  userId?: string;
  pluginId?: string;
  pluginPrice?: number;
  securityScanResult?: {
    isSecure: boolean;
    threats: Array<{
      type: string;
      level: string;
      description: string;
      location: string;
    }>;
  };
}>();

// 获取插件信息
async function getPluginInfo(pluginId: string): Promise<{id: string; name: string; price: number; description: string} | null> {
  try {
    // 从现有的plugins API获取插件信息
    const response = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/store/plugins`);
    const data = await response.json();
    
    if (data.success && data.plugins) {
      return data.plugins.find((p: any) => p.id === pluginId) || null;
    }
    return null;
  } catch (error) {
    console.error('获取插件信息失败:', error);
    return null;
  }
}

// 检查用户是否有权限安装插件
async function checkInstallPermission(userId: string, pluginId: string, price: number): Promise<{allowed: boolean; reason?: string}> {
  try {
    // 如果是免费插件，直接允许
    if (price === 0) {
      return { allowed: true };
    }

    // 检查用户是否已购买此插件
    const licenses = await StoreRepo.listLicenses(userId);
    const hasLicense = licenses.some(license => 
      license.pluginId === pluginId && license.expires > Date.now()
    );

    if (hasLicense) {
      return { allowed: true };
    }

    return { 
      allowed: false, 
      reason: '您尚未购买此插件，请先完成购买后再安装' 
    };
  } catch (error) {
    console.error('检查安装权限失败:', error);
    return { 
      allowed: false, 
      reason: '权限验证失败，请重试' 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, pluginId, userId, downloadUrl, installId, downloadToken } = await request.json();

    switch (action) {
      case 'start':
        if (!pluginId || !userId) {
          return NextResponse.json(
            { success: false, error: '参数不完整' },
            { status: 400 }
          );
        }

        // 验证用户认证
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
          return NextResponse.json(
            { success: false, error: '未授权，请先登录' },
            { status: 401 }
          );
        }

        const payload = verifyToken(token);
        if (!payload) {
          return NextResponse.json(
            { success: false, error: 'Token无效' },
            { status: 401 }
          );
        }

        // 检查插件信息
        const pluginInfo = await getPluginInfo(pluginId);
        if (!pluginInfo) {
          return NextResponse.json(
            { success: false, error: '插件不存在' },
            { status: 404 }
          );
        }

        // 检查用户是否有权限安装此插件
        const hasPermission = await checkInstallPermission(payload.userId, pluginId, pluginInfo.price);
        if (!hasPermission.allowed) {
          return NextResponse.json(
            { success: false, error: hasPermission.reason },
            { status: 403 }
          );
        }

        const newInstallId = `${payload.userId}_${pluginId}`;

        // 开始安装
        installProgress.set(newInstallId, {
          status: 'downloading',
          progress: 0,
          message: '正在下载模块文件...',
          startTime: Date.now(),
          userId: payload.userId,
          pluginId: pluginId,
          pluginPrice: pluginInfo.price
        });

        // 异步执行安装过程
        simulateInstallProcess(newInstallId, pluginId, downloadUrl, payload.userId, pluginInfo);

        return NextResponse.json({
          success: true,
          installId: newInstallId,
          message: '安装已开始'
        });

      case 'status':
        // 查询安装状态
        if (!installId) {
          return NextResponse.json(
            { success: false, error: '缺少安装ID' },
            { status: 400 }
          );
        }

        const progress = installProgress.get(installId);
        if (!progress) {
          return NextResponse.json(
            { success: false, error: '安装任务不存在' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          ...progress
        });

      default:
        return NextResponse.json(
          { success: false, error: '无效的操作' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('安装API错误:', error);
    return NextResponse.json(
      { success: false, error: '安装失败' },
      { status: 500 }
    );
  }
}

async function simulateInstallProcess(installId: string, pluginId: string, downloadUrl: string | undefined, userId: string, pluginInfo: any) {
  try {
    // 阶段1: 下载文件 (0-30%)
    for (let i = 0; i <= 30; i += 5) {
      installProgress.set(installId, {
        status: 'downloading',
        progress: i,
        message: `正在下载模块文件... ${i}%`,
        startTime: installProgress.get(installId)?.startTime || Date.now(),
        userId,
        pluginId,
        pluginPrice: pluginInfo.price
      });
      await sleep(200);
    }

    // 阶段2: 安全扫描 (30-50%)
    installProgress.set(installId, {
      status: 'scanning',
      progress: 35,
      message: '正在进行安全扫描...',
      startTime: installProgress.get(installId)?.startTime || Date.now(),
      userId,
      pluginId,
      pluginPrice: pluginInfo.price
    });
    await sleep(500);

    // 模拟安全扫描结果
    const mockSecurityResult = {
      isSecure: true,
      threats: [] as Array<{type: string; level: string; description: string; location: string}>
    };

    installProgress.set(installId, {
      status: 'scanning',
      progress: 50,
      message: '安全扫描完成，未发现威胁',
      startTime: installProgress.get(installId)?.startTime || Date.now(),
      userId,
      pluginId,
      pluginPrice: pluginInfo.price,
      securityScanResult: mockSecurityResult
    });
    await sleep(300);

    // 阶段3: 验证文件 (50-70%)
    for (let i = 50; i <= 70; i += 10) {
      installProgress.set(installId, {
        status: 'installing',
        progress: i,
        message: '正在验证模块文件...',
        startTime: installProgress.get(installId)?.startTime || Date.now(),
        userId,
        pluginId,
        pluginPrice: pluginInfo.price,
        securityScanResult: mockSecurityResult
      });
      await sleep(300);
    }

    // 阶段4: 安装模块 (70-90%)
    for (let i = 70; i <= 90; i += 10) {
      installProgress.set(installId, {
        status: 'installing',
        progress: i,
        message: '正在安装模块到系统...',
        startTime: installProgress.get(installId)?.startTime || Date.now(),
        userId,
        pluginId,
        pluginPrice: pluginInfo.price,
        securityScanResult: mockSecurityResult
      });
      await sleep(400);
    }

    // 阶段5: 完成安装 (90-100%)
    installProgress.set(installId, {
      status: 'installing',
      progress: 95,
      message: '正在注册模块...',
      startTime: installProgress.get(installId)?.startTime || Date.now(),
      userId,
      pluginId,
      pluginPrice: pluginInfo.price,
      securityScanResult: mockSecurityResult
    });
    await sleep(500);

    // 记录安装成功
    await recordInstallation(userId, pluginId, pluginInfo);

    // 完成
    installProgress.set(installId, {
      status: 'completed',
      progress: 100,
      message: '模块安装完成！',
      startTime: installProgress.get(installId)?.startTime || Date.now(),
      userId,
      pluginId,
      pluginPrice: pluginInfo.price,
      securityScanResult: mockSecurityResult
    });

    // 记录安装日志
    try {
      await logInstallation(pluginId, 'success', userId);
    } catch (logError) {
      console.error('记录安装日志失败:', logError);
    }

    // 5分钟后清理进度记录
    setTimeout(() => {
      installProgress.delete(installId);
    }, 5 * 60 * 1000);

  } catch (error: any) {
    console.error('安装过程错误:', error);
    installProgress.set(installId, {
      status: 'failed',
      progress: 0,
      message: '安装失败: ' + error.message,
      startTime: installProgress.get(installId)?.startTime || Date.now(),
      userId,
      pluginId,
      pluginPrice: pluginInfo.price
    });
    
    // 记录失败日志
    try {
      await logInstallation(pluginId, 'failed', userId);
    } catch (logError) {
      console.error('记录安装日志失败:', logError);
    }
  }
}

async function logInstallation(pluginId: string, status: 'success' | 'failed', userId?: string) {
  try {
    // 这里可以记录到数据库或日志文件
    
    
    // 如果需要，可以记录到数据库
    // await prisma.installLog.create({
    //   data: {
    //     pluginId,
    //     userId,
    //     status,
    //     installedAt: new Date()
    //   }
    // });
  } catch (error) {
    console.error('记录安装日志错误:', error);
  }
}

// 记录成功安装到用户许可证（对于付费插件）
async function recordInstallation(userId: string, pluginId: string, pluginInfo: any) {
  try {
    if (pluginInfo.price > 0) {
      // 对于付费插件，确保用户有有效许可证
      const licenses = await StoreRepo.listLicenses(userId);
      const hasValidLicense = licenses.some(license => 
        license.pluginId === pluginId && license.expires > Date.now()
      );
      
      if (!hasValidLicense) {
        throw new Error('用户没有有效的插件许可证');
      }
    }
    
    // 记录安装事件（可以用于统计和审计）
    
    
    // 这里可以添加更多的安装后处理逻辑
    // 比如发送通知、更新使用统计等
    
  } catch (error) {
    console.error('记录安装失败:', error);
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
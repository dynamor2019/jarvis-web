import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { broadcastToAllClients } from './sse/route';
import { connectedClients } from './clients-store';

interface BroadcastSendRecord {
  timestamp: number; // 发送时间戳
  time: string; // 发送时间 (HH:mm:ss)
  count: number; // 该次发送的计数
}

interface Broadcast {
  id: string;
  title: string;
  content: string;
  type: 'promotion' | 'tutorial' | 'announcement' | 'service';
  priority: number;
  startTime: number;
  endTime: number;
  targetAudience: 'all' | 'free' | 'paid' | 'new';
  displayDuration: number;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
  createdAt: number;
  createdBy: string;
  isActive: boolean;
  displayCount?: number; // 播放次数统计
  lastDisplayTime?: number; // 最后一次播放时间
  sendRecords?: BroadcastSendRecord[]; // 发送记录列表
}

const BROADCASTS_FILE = path.join(process.cwd(), 'data', 'broadcasts.json');
const PC_BACKEND_BROADCAST_URL = process.env.JARVIS_PC_BROADCAST_URL || 'http://127.0.0.1:37641/api/broadcast/push';

async function pushToPcBackend(message: any): Promise<number> {
  try {
    const response = await fetch(PC_BACKEND_BROADCAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn('[Broadcast] PC backend push failed:', response.status);
      return 0;
    }

    const data = await response.json().catch(() => null);
    return Number(data?.sentCount || 0);
  } catch (error) {
    console.warn('[Broadcast] PC backend push unavailable:', error);
    return 0;
  }
}

async function getPcBackendBroadcastStatus(): Promise<{ activeClients: number; connectedCount: number } | null> {
  try {
    const statusUrl = PC_BACKEND_BROADCAST_URL.replace(/\/push$/, '');
    const response = await fetch(statusUrl, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return {
      activeClients: Number(data?.activeClients || 0),
      connectedCount: Number(data?.connectedCount || data?.activeClients || 0)
    };
  } catch {
    return null;
  }
}

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.mkdir(path.dirname(BROADCASTS_FILE), { recursive: true });
  } catch (error) {
    console.error('创建数据目录失败:', error);
  }
}

// 读取广播数据
async function loadBroadcasts(): Promise<Broadcast[]> {
  try {
    await ensureDataDir();
    try {
      const data = await fs.readFile(BROADCASTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      // 文件不存在是正常的，返回空数组
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  } catch (error) {
    console.error('读取广播数据失败:', error);
    return [];
  }
}

// 保存广播数据
async function saveBroadcasts(broadcasts: Broadcast[]) {
  try {
    await ensureDataDir();
    
    // 去重：按ID分组，保留最新的记录
    const uniqueBroadcasts = new Map<string, Broadcast>();
    broadcasts.forEach(b => {
      const existing = uniqueBroadcasts.get(b.id);
      if (!existing) {
        uniqueBroadcasts.set(b.id, b);
      } else {
        // 合并sendRecords
        if (b.sendRecords && b.sendRecords.length > 0) {
          if (!existing.sendRecords) {
            existing.sendRecords = [];
          }
          existing.sendRecords.push(...b.sendRecords);
          // 按时间戳排序并去重
          const recordMap = new Map<number, any>();
          existing.sendRecords.forEach(r => {
            recordMap.set(r.timestamp, r);
          });
          existing.sendRecords = Array.from(recordMap.values())
            .sort((a, b) => a.timestamp - b.timestamp);
        }
        // 更新计数为最大值
        if (b.displayCount && b.displayCount > (existing.displayCount || 0)) {
          existing.displayCount = b.displayCount;
        }
      }
    });
    
    const deduplicatedBroadcasts = Array.from(uniqueBroadcasts.values());
    await fs.writeFile(BROADCASTS_FILE, JSON.stringify(deduplicatedBroadcasts, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存广播数据失败:', error);
    throw error;
  }
}

// 去重函数：按ID分组，合并sendRecords
function deduplicateBroadcasts(broadcasts: Broadcast[]): Broadcast[] {
  const uniqueBroadcasts = new Map<string, Broadcast>();
  
  broadcasts.forEach(b => {
    const existing = uniqueBroadcasts.get(b.id);
    if (!existing) {
      uniqueBroadcasts.set(b.id, { ...b });
    } else {
      // 合并sendRecords
      if (b.sendRecords && b.sendRecords.length > 0) {
        if (!existing.sendRecords) {
          existing.sendRecords = [];
        }
        // 添加新的发送记录
        b.sendRecords.forEach(newRecord => {
          // 检查是否已存在相同时间戳的记录
          const exists = existing.sendRecords!.some(r => r.timestamp === newRecord.timestamp);
          if (!exists) {
            existing.sendRecords!.push(newRecord);
          }
        });
        // 按时间戳排序
        existing.sendRecords!.sort((a, b) => a.timestamp - b.timestamp);
      }
      // 更新计数为最大值
      if (b.displayCount && b.displayCount > (existing.displayCount || 0)) {
        existing.displayCount = b.displayCount;
      }
    }
  });
  
  return Array.from(uniqueBroadcasts.values());
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const audience = url.searchParams.get('audience') || 'all';

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    };

    

    if (action === 'active') {
      const broadcasts = await loadBroadcasts();
      const now = Date.now();
      
      
      
      // 获取所有符合条件的广播（不限制整点）
      const activeBroadcasts = broadcasts
        .filter(b => 
          b.isActive && 
          b.startTime <= now && 
          b.endTime > now &&
          (b.targetAudience === 'all' || b.targetAudience === audience)
        )
        .sort((a, b) => b.priority - a.priority);

      

      // 只在首次获取时增加计数（通过检查lastDisplayTime）
      // 如果距离上次显示超过1分钟，则认为是新的一次显示
      const oneMinuteAgo = now - 60000;
      const broadcastsToUpdate = activeBroadcasts.filter(b => 
        !b.lastDisplayTime || b.lastDisplayTime < oneMinuteAgo
      );

      if (broadcastsToUpdate.length > 0) {
        
        
        // 更新计数和最后显示时间，并记录发送时间
        broadcastsToUpdate.forEach(b => {
          b.displayCount = (b.displayCount || 0) + 1;
          b.lastDisplayTime = now;
          
          // 记录发送时间
          if (!b.sendRecords) {
            b.sendRecords = [];
          }
          const sendTime = new Date(now);
          b.sendRecords.push({
            timestamp: now,
            time: sendTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            count: b.displayCount
          });
        });
        
        // 保存更新
        const updatedBroadcasts = broadcasts.map(b => {
          const updated = broadcastsToUpdate.find(u => u.id === b.id);
          return updated || b;
        });
        await saveBroadcasts(updatedBroadcasts);
      }

      
      
      return NextResponse.json({
        success: true,
        broadcasts: activeBroadcasts
      }, { headers });
    }

    // 管理员获取所有广播
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401, headers });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401, headers });
    }

    const broadcasts = await loadBroadcasts();
    
    // 去重：按ID分组，保留最新的记录（包含完整的sendRecords）
    const allBroadcasts = deduplicateBroadcasts(broadcasts)
      .sort((a, b) => b.createdAt - a.createdAt);

    const pcBackend = await getPcBackendBroadcastStatus();

    return NextResponse.json({
      success: true,
      broadcasts: allBroadcasts,
      activeClients: pcBackend?.activeClients ?? connectedClients.size,
      connectedCount: pcBackend?.connectedCount ?? connectedClients.size,
      webConnectedCount: connectedClients.size,
      pcBackendConnectedCount: pcBackend?.connectedCount ?? 0
    }, { headers });
  } catch (error) {
    console.error('获取广播错误:', error);
    return NextResponse.json(
      { success: false, error: '获取广播失败' },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }}
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 });
    }

    const body = await request.json();

    // 处理超级发送请求（即时推送）
    // 支持两种格式：
    // 1. { action: 'super_send', broadcastId: '...' } (旧格式)
    // 2. { sendNow: true, id: '...' } (新格式)
    if (body.action === 'super_send' || (body.sendNow && body.id)) {
      const broadcastId = body.broadcastId || body.id;
      
      
      
      const broadcasts = await loadBroadcasts();
      const broadcast = broadcasts.find(b => b.id === broadcastId);

      if (!broadcast) {
        
        return NextResponse.json(
          { success: false, error: '广播不存在' },
          { status: 404 }
        );
      }

      const now = Date.now();
      
      // 🔥 直接推送 super_send 消息给所有连接的客户端
      
      
      
      const message = {
        type: 'broadcast',
        action: 'super_send',
        broadcast: broadcast,
        timestamp: now
      };
      const webSuccessCount = broadcastToAllClients(message);
      const pcSuccessCount = await pushToPcBackend(message);
      const successCount = webSuccessCount + pcSuccessCount;

      
      
      // 记录发送时间
      if (!broadcast.sendRecords) {
        broadcast.sendRecords = [];
      }
      
      const sendTime = new Date(now);
      broadcast.sendRecords.push({
        timestamp: now,
        time: sendTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        count: successCount
      });
      
      // 更新显示计数和最后显示时间
      broadcast.displayCount = (broadcast.displayCount || 0) + successCount;
      broadcast.lastDisplayTime = now;
      
      // 保存更新
      await saveBroadcasts(broadcasts);

      return NextResponse.json({
        success: true,
        message: `超级发送成功，已发送给 ${successCount} 个客户端`,
        sentCount: successCount,
        broadcast
      });
    }

    // 处理创建广播请求
    const {
      title,
      content,
      type,
      priority,
      startTime,
      endTime,
      targetAudience,
      displayDuration,
      imageUrl,
      actionUrl,
      actionText,
      sendNow
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const broadcastId = `broadcast_${Date.now()}`;
    const now = Date.now();
    
    const newBroadcast: Broadcast = {
      id: broadcastId,
      title,
      content,
      type: type || 'announcement',
      priority: priority || 3,
      startTime: startTime || now,
      endTime: endTime || (now + 7 * 24 * 60 * 60 * 1000),
      targetAudience: targetAudience || 'all',
      displayDuration: displayDuration || 60,
      imageUrl,
      actionUrl,
      actionText,
      createdAt: now,
      createdBy: payload.userId,
      isActive: true,
      displayCount: 0,
      lastDisplayTime: 0
    };

    const broadcasts = await loadBroadcasts();
    broadcasts.push(newBroadcast);
    await saveBroadcasts(broadcasts);

    // 如果指定了sendNow，立即推送给所有连接的客户端
    if (sendNow) {
      
      
      
      const message = {
        type: 'broadcast',
        action: 'hourly',
        broadcast: newBroadcast,
        timestamp: now
      };
      broadcastToAllClients(message);
      await pushToPcBackend(message);
    }

    return NextResponse.json({
      success: true,
      broadcast: newBroadcast,
      message: sendNow ? '广播已创建并立即推送' : '广播已创建'
    });
  } catch (error) {
    console.error('处理广播请求错误:', error);
    return NextResponse.json(
      { success: false, error: '处理请求失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 });
    }

    const { id, ...updates } = await request.json();

    const broadcasts = await loadBroadcasts();
    const index = broadcasts.findIndex(b => b.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: '广播不存在' },
        { status: 404 }
      );
    }

    broadcasts[index] = { ...broadcasts[index], ...updates };
    await saveBroadcasts(broadcasts);

    return NextResponse.json({
      success: true,
      broadcast: broadcasts[index]
    });
  } catch (error) {
    console.error('更新广播错误:', error);
    return NextResponse.json(
      { success: false, error: '更新广播失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token无效' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    const broadcasts = await loadBroadcasts();
    const index = broadcasts.findIndex(b => b.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: '广播不存在' },
        { status: 404 }
      );
    }

    broadcasts.splice(index, 1);
    await saveBroadcasts(broadcasts);

    return NextResponse.json({
      success: true,
      message: '广播已删除'
    });
  } catch (error) {
    console.error('删除广播错误:', error);
    return NextResponse.json(
      { success: false, error: '删除广播失败' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

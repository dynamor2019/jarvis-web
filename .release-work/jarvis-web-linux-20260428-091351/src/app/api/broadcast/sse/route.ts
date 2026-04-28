// [CodeGuard Feature Index]
// - Imports and shared state -> line 9
// - Broadcast data read/write helpers -> line 18
// - Hourly scheduler and push logic -> line 52
// - SSE GET handler and client lifecycle -> line 184
// - CORS preflight handler -> line 323
// [/CodeGuard Feature Index]

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { connectedClients, userConnections, addClient, removeClient } from '../clients-store';

const BROADCASTS_FILE = path.join(process.cwd(), 'data', 'broadcasts.json');
let hourlyBroadcastInterval: NodeJS.Timeout | null = null;
const HEARTBEAT_INTERVAL = 15 * 1000; // 15秒发送一次心跳，避免上游空闲超时断开

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.mkdir(path.dirname(BROADCASTS_FILE), { recursive: true });
  } catch (error) {
    console.error('创建数据目录失败:', error);
  }
}

// 读取广播数据
async function loadBroadcasts() {
  try {
    await ensureDataDir();
    try {
      const data = await fs.readFile(BROADCASTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
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
async function saveBroadcasts(broadcasts: any[]) {
  try {
    await ensureDataDir();
    await fs.writeFile(BROADCASTS_FILE, JSON.stringify(broadcasts, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存广播数据失败:', error);
    throw error;
  }
}

// 计算下一个整点的时间（毫秒）
function getNextHourTimestamp(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1);
  nextHour.setMinutes(0);
  nextHour.setSeconds(0);
  nextHour.setMilliseconds(0);
  return nextHour.getTime();
}

// 计算距离下一个整点的延迟（毫秒）
function getDelayToNextHour(): number {
  return getNextHourTimestamp() - Date.now();
}

// 向所有连接的客户端推送消息
export function broadcastToAllClients(message: any): number {
  const data = JSON.stringify(message);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(`data: ${data}\n\n`);

  

  if (connectedClients.size === 0) {
    
    return 0;
  }

  const deadClients: string[] = [];
  let successCount = 0;
  
  connectedClients.forEach((client, clientId) => {
    try {
      client.response.enqueue(encoded);
      successCount++;
      
    } catch (error) {
      console.error(`[Broadcast] 发送给客户端 ${clientId} 失败:`, error);
      deadClients.push(clientId);
    }
  });
  
  // 清理死连接
  deadClients.forEach(clientId => {
    removeClient(clientId);
  });
  
  
  return successCount;
}

// 整点时推送广告给所有客户端
async function broadcastHourlyAds() {
  try {
    const now = Date.now();
    const nowDate = new Date(now);
    
    
    
    const broadcasts = await loadBroadcasts();
    
    // 获取所有符合条件的活跃广播
    const activeBroadcasts = broadcasts
      .filter((b: any) => 
        b.isActive && 
        b.startTime <= now && 
        b.endTime > now
      )
      .sort((a: any, b: any) => b.priority - a.priority);
    
    
    
    
    // 向所有客户端推送活跃广告
    activeBroadcasts.forEach((broadcast: any) => {
      const successCount = broadcastToAllClients({
        type: 'broadcast',
        action: 'hourly',
        broadcast: broadcast,
        timestamp: now
      });
      
      
      
      // 更新发送记录
      if (!broadcast.sendRecords) {
        broadcast.sendRecords = [];
      }
      const sendTime = new Date(now);
      broadcast.sendRecords.push({
        timestamp: now,
        time: sendTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        count: successCount
      });
      
      // 更新显示计数
      broadcast.displayCount = (broadcast.displayCount || 0) + successCount;
      broadcast.lastDisplayTime = now;
    });
    
    // 保存更新的广播数据
    if (activeBroadcasts.length > 0) {
      await saveBroadcasts(broadcasts);
    }
  } catch (error) {
    console.error('[Hourly] 推送广告失败:', error);
  }
}

// 启动整点广告定时器
let lastBroadcastHour = -1; // 全局变量，记录上次广播的小时，防止重复推送

function startHourlyBroadcastTimer() {
  if (hourlyBroadcastInterval) {
    return; // 已经启动
  }
  
  
  
  // 计算距离下一个整点的延迟
  const scheduleNextBroadcast = () => {
    const delay = getDelayToNextHour();
    
    
    hourlyBroadcastInterval = setTimeout(() => {
      const currentHour = new Date().getHours();
      
      // 只在整点时推送一次（防止重复）
      if (currentHour !== lastBroadcastHour) {
        lastBroadcastHour = currentHour;
        
        broadcastHourlyAds();
      } else {
        
      }
      
      // 广播完成后，重新安排下一次
      scheduleNextBroadcast();
    }, delay);
  };
  
  scheduleNextBroadcast();
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.headers.get('x-user-id');
    
    let userId = 'anonymous';
    
    // 如果提供了 token，验证它；否则允许匿名连接（用于广告推送）
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.userId || 'anonymous';
      }
    }

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    

    // 设置 SSE 响应头
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    };

    // 创建可读流
    const stream = new ReadableStream({
      start(controller) {
        const now = Date.now();
        
        // 如果该用户已有连接，关闭旧连接
        const oldClientIds = userConnections.get(userId);
        if (oldClientIds) {
          oldClientIds.forEach(oldClientId => {
            
            const oldClient = connectedClients.get(oldClientId);
            if (oldClient) {
              try {
                oldClient.response.close();
                
              } catch (error) {
                console.error(`[SSE] 关闭旧连接 ${oldClientId} 失败:`, error);
              }
            }
            removeClient(oldClientId);
          });
        }
        
        // 存储客户端连接
        addClient(clientId, {
          response: controller,
          userId,
          token,
          connectedAt: now,
        });

        // 启动定时器（只在有客户端连接时启动）
        startHourlyBroadcastTimer();

        // 发送连接成功消息
        const encoder = new TextEncoder();
        const connectMsg = encoder.encode(`data: ${JSON.stringify({ 
          type: 'connected', 
          clientId,
          timestamp: now 
        })}\n\n`);
        controller.enqueue(connectMsg);

        

        // 定期发送心跳，用于保持 SSE 连接活跃并统计连接数
        const heartbeatInterval = setInterval(() => {
          try {
            const client = connectedClients.get(clientId);
            if (!client) {
              
              clearInterval(heartbeatInterval);
              return;
            }
            
            // SSE 注释心跳，兼容部分代理对注释行的长连接保活策略
            const pingComment = encoder.encode(`: ping ${Date.now()}\n\n`);
            client.response.enqueue(pingComment);

            const heartbeat = encoder.encode(`data: ${JSON.stringify({ 
              type: 'heartbeat',
              timestamp: Date.now(),
              connectedCount: connectedClients.size
            })}\n\n`);
            client.response.enqueue(heartbeat);
            
          } catch (error) {
            console.error(`[SSE] 发送心跳给客户端 ${clientId} 失败:`, error);
            clearInterval(heartbeatInterval);
            removeClient(clientId);
          }
        }, HEARTBEAT_INTERVAL);

        // 处理客户端断开连接
        const cleanup = () => {
          clearInterval(heartbeatInterval);
          removeClient(clientId);
          try {
            controller.close();
          } catch {}
          
        };

        // 监听流关闭
        request.signal.addEventListener('abort', cleanup);
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error('[SSE] GET 请求处理失败:', error);
    return NextResponse.json(
      { error: '连接失败' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-user-id',
    },
  });
}

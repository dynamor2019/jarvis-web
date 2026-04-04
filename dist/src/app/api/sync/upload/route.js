import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getClientIp } from '@/lib/ip';

// 数据存储路径
const DATA_DIR = path.join(process.cwd(), 'data');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const STATS_FILE = path.join(DATA_DIR, 'usage_stats.json');

// 确保数据目录存在
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// 读取客户端数据
async function loadClientsData() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(CLIENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// 保存客户端数据
async function saveClientsData(clients) {
    await ensureDataDir();
    await fs.writeFile(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf-8');
}

// 读取使用统计
async function loadUsageStats() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(STATS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {
            totalClients: 0,
            totalOperations: 0,
            functionUsage: {},
            dailyStats: {},
            clientIPs: {}
        };
    }
}

// 保存使用统计
async function saveUsageStats(stats) {
    await ensureDataDir();
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
}

// 读取提示词数据
async function loadPromptsData() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(PROMPTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// 合并提示词数据
function mergePrompts(existing, newPrompts) {
    const all = [...existing, ...newPrompts];
    
    // 去重：基于act和prompt的组合
    const unique = all
        .filter(p => p.act && p.act.trim() && p.prompt && p.prompt.trim())
        .reduce((acc, item) => {
            const key = `${item.act.trim()}|${item.prompt.trim()}`;
            if (!acc.has(key)) {
                acc.set(key, item);
            }
            return acc;
        }, new Map());
    
    return Array.from(unique.values());
}

// 处理客户端上传的同步数据
export async function POST(request) {
    try {
        const syncData = await request.json();
        const { clientId, tokenBalance, prompts, stats, lastSync } = syncData;
        
        // 强制使用服务器检测到的真实IP，忽略客户端上报的IP
        const clientIP = getClientIp(request);
        
        if (!clientId) {
            return NextResponse.json({
                success: false,
                message: 'Client ID is required'
            }, { status: 400 });
        }
        
        
        
        // 加载现有数据
        const [clients, usageStats, existingPrompts] = await Promise.all([
            loadClientsData(),
            loadUsageStats(),
            loadPromptsData()
        ]);
        
        // 更新客户端信息
        const now = new Date().toISOString();
        const today = new Date().toISOString().split('T')[0];
        
        clients[clientId] = {
            clientId,
            lastIP: clientIP,
            tokenBalance: tokenBalance || 0,
            lastSync: now,
            version: stats?.version || '1.0.0',
            totalOperations: stats?.totalOperations || 0,
            lastActive: stats?.lastActive || now
        };
        
        // 更新使用统计
        if (stats && stats.functionUsage) {
            // 合并功能使用统计
            Object.entries(stats.functionUsage).forEach(([func, count]) => {
                usageStats.functionUsage[func] = (usageStats.functionUsage[func] || 0) + count;
            });
            
            // 更新总操作数
            usageStats.totalOperations += stats.totalOperations || 0;
        }
        
        // 更新客户端数量
        usageStats.totalClients = Object.keys(clients).length;
        
        // 更新每日统计
        if (!usageStats.dailyStats[today]) {
            usageStats.dailyStats[today] = {
                activeClients: new Set(),
                operations: 0,
                newClients: 0
            };
        }
        
        usageStats.dailyStats[today].activeClients.add(clientId);
        usageStats.dailyStats[today].operations += stats?.totalOperations || 0;
        
        // 转换Set为数组以便JSON序列化
        Object.keys(usageStats.dailyStats).forEach(date => {
            if (usageStats.dailyStats[date].activeClients instanceof Set) {
                usageStats.dailyStats[date].activeClients = Array.from(usageStats.dailyStats[date].activeClients);
            }
        });
        
        // 更新IP统计
        if (clientIP && clientIP !== 'Unknown') {
            if (!usageStats.clientIPs[clientIP]) {
                usageStats.clientIPs[clientIP] = {
                    clients: new Set(),
                    firstSeen: now,
                    lastSeen: now
                };
            }
            usageStats.clientIPs[clientIP].clients.add(clientId);
            usageStats.clientIPs[clientIP].lastSeen = now;
            
            // 转换Set为数组
            Object.keys(usageStats.clientIPs).forEach(ip => {
                if (usageStats.clientIPs[ip].clients instanceof Set) {
                    usageStats.clientIPs[ip].clients = Array.from(usageStats.clientIPs[ip].clients);
                }
            });
        }
        
        // 合并提示词数据
        let updatedPrompts = existingPrompts;
        if (prompts && prompts.length > 0) {
            updatedPrompts = mergePrompts(existingPrompts, prompts);
            
            // 如果有新的提示词，保存到文件
            if (updatedPrompts.length > existingPrompts.length) {
                await fs.writeFile(PROMPTS_FILE, JSON.stringify(updatedPrompts, null, 2), 'utf-8');
                
            }
        }
        
        // 保存更新的数据
        await Promise.all([
            saveClientsData(clients),
            saveUsageStats(usageStats)
        ]);
        
        
        
        // 返回服务器端的最新数据
        return NextResponse.json({
            success: true,
            message: 'Sync completed successfully',
            data: {
                clientId,
                tokenBalance: clients[clientId].tokenBalance,
                prompts: updatedPrompts,
                stats: {
                    totalClients: usageStats.totalClients,
                    totalOperations: usageStats.totalOperations,
                    serverVersion: '1.0.0'
                },
                lastSync: now
            }
        });
        
    } catch (error) {
        console.error('[Sync] Upload error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
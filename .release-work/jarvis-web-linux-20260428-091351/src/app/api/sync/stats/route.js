import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// 数据存储路径
const DATA_DIR = path.join(process.cwd(), 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const STATS_FILE = path.join(DATA_DIR, 'usage_stats.json');

// 读取客户端数据
async function loadClientsData() {
    try {
        const data = await fs.readFile(CLIENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// 读取使用统计
async function loadUsageStats() {
    try {
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

// 获取统计数据
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const adminKey = searchParams.get('adminKey');
        
        // 简单的管理员验证
        if (adminKey !== process.env.ADMIN_KEY) {
            return NextResponse.json({
                success: false,
                message: 'Unauthorized'
            }, { status: 401 });
        }
        
        // 加载数据
        const [clients, usageStats] = await Promise.all([
            loadClientsData(),
            loadUsageStats()
        ]);
        
        // 处理客户端数据
        const clientList = Object.values(clients).map(client => ({
            ...client,
            lastSyncAgo: client.lastSync ? 
                Math.floor((new Date() - new Date(client.lastSync)) / (1000 * 60 * 60 * 24)) : null
        }));
        
        // 处理每日统计
        const dailyStatsArray = Object.entries(usageStats.dailyStats || {})
            .map(([date, stats]) => ({
                date,
                activeClients: Array.isArray(stats.activeClients) ? stats.activeClients.length : 0,
                operations: stats.operations || 0,
                newClients: stats.newClients || 0
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 30); // 最近30天
        
        // 处理IP统计
        const ipStatsArray = Object.entries(usageStats.clientIPs || {})
            .map(([ip, stats]) => ({
                ip,
                clientCount: Array.isArray(stats.clients) ? stats.clients.length : 0,
                firstSeen: stats.firstSeen,
                lastSeen: stats.lastSeen
            }))
            .sort((a, b) => b.clientCount - a.clientCount)
            .slice(0, 50); // Top 50 IPs
        
        // 处理功能使用统计
        const functionStatsArray = Object.entries(usageStats.functionUsage || {})
            .map(([func, count]) => ({ function: func, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Top 20 functions
        
        const response = {
            success: true,
            data: {
                overview: {
                    totalClients: usageStats.totalClients || 0,
                    totalOperations: usageStats.totalOperations || 0,
                    activeToday: dailyStatsArray[0]?.activeClients || 0,
                    operationsToday: dailyStatsArray[0]?.operations || 0
                },
                clients: clientList,
                dailyStats: dailyStatsArray,
                ipStats: ipStatsArray,
                functionStats: functionStatsArray,
                lastUpdated: new Date().toISOString()
            }
        };
        
        return NextResponse.json(response);
        
    } catch (error) {
        console.error('[Sync] Stats error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
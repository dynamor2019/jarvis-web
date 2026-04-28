import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// 数据存储路径
const DATA_DIR = path.join(process.cwd(), 'data');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

// 读取客户端数据
async function loadClientsData() {
    try {
        const data = await fs.readFile(CLIENTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// 读取提示词数据
async function loadPromptsData() {
    try {
        const data = await fs.readFile(PROMPTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// 检查客户端是否需要更新
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const lastSync = searchParams.get('lastSync');
        
        if (!clientId) {
            return NextResponse.json({
                success: false,
                message: 'Client ID is required'
            }, { status: 400 });
        }
        
        
        
        // 加载数据
        const [clients, prompts] = await Promise.all([
            loadClientsData(),
            loadPromptsData()
        ]);
        
        // 获取提示词文件的最后修改时间
        let promptsLastModified = null;
        try {
            const stats = await fs.stat(PROMPTS_FILE);
            promptsLastModified = stats.mtime.toISOString();
        } catch {
            promptsLastModified = new Date().toISOString();
        }
        
        // 检查是否需要更新
        let needsUpdate = true;
        if (lastSync && promptsLastModified) {
            const lastSyncDate = new Date(lastSync);
            const lastModifiedDate = new Date(promptsLastModified);
            needsUpdate = lastModifiedDate > lastSyncDate;
        }
        
        // 获取客户端信息
        const clientInfo = clients[clientId] || {};
        
        const response = {
            success: true,
            needsUpdate,
            message: needsUpdate ? 'Updates available' : 'No updates needed',
            data: {
                clientId,
                tokenBalance: clientInfo.tokenBalance || 0,
                prompts: needsUpdate ? prompts : [],
                stats: {
                    totalClients: Object.keys(clients).length,
                    serverVersion: '1.0.0',
                    promptsCount: prompts.length,
                    lastModified: promptsLastModified
                },
                lastSync: clientInfo.lastSync || null
            }
        };
        
        
        
        return NextResponse.json(response);
        
    } catch (error) {
        console.error('[Sync] Check error:', error);
        return NextResponse.json({
            success: false,
            message: error.message
        }, { status: 500 });
    }
}
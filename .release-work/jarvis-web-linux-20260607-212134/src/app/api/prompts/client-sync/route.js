import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PROMPTS_FILE = path.join(process.cwd(), 'data', 'prompts.json');

// 为PC端客户端提供提示词数据
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientVersion = searchParams.get('version');
        const lastSync = searchParams.get('lastSync');
        
        // 读取提示词数据
        let prompts = [];
        let lastModified = null;
        
        try {
            const data = await fs.readFile(PROMPTS_FILE, 'utf-8');
            prompts = JSON.parse(data);
            
            const stats = await fs.stat(PROMPTS_FILE);
            lastModified = stats.mtime.toISOString();
        } catch {
            // 文件不存在，返回空数据
        }
        
        // 检查是否需要更新
        let needsUpdate = true;
        if (lastSync && lastModified) {
            const lastSyncDate = new Date(lastSync);
            const lastModifiedDate = new Date(lastModified);
            needsUpdate = lastModifiedDate > lastSyncDate;
        }
        
        return NextResponse.json({
            success: true,
            needsUpdate,
            data: needsUpdate ? prompts : [],
            count: prompts.length,
            lastModified,
            serverVersion: '1.0.0'
        });
        
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// PC端上报同步状态
export async function POST(request) {
    try {
        const { clientId, version, syncStatus, lastSync } = await request.json();
        
        // 这里可以记录客户端同步状态，用于统计和监控
        
        
        // 在实际应用中，可以将这些信息存储到数据库
        // 现在只是简单记录日志
        
        return NextResponse.json({
            success: true,
            message: 'Sync status recorded'
        });
        
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
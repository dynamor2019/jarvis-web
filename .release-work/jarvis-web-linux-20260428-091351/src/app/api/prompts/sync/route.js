import { NextResponse } from 'next/server';
import { scrapePrompts, mergePrompts } from '@/lib/promptSeeder';
import fs from 'fs/promises';
import path from 'path';

// 存储提示词数据的文件路径
const PROMPTS_FILE = path.join(process.cwd(), 'data', 'prompts.json');

// 确保数据目录存在
async function ensureDataDir() {
    const dataDir = path.dirname(PROMPTS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// 读取现有提示词数据
async function loadExistingPrompts() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(PROMPTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// 保存提示词数据
async function savePrompts(prompts) {
    await ensureDataDir();
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2), 'utf-8');
}

// GET: 获取当前提示词数据
export async function GET() {
    try {
        const prompts = await loadExistingPrompts();
        return NextResponse.json({
            success: true,
            data: prompts,
            count: prompts.length,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// POST: 执行提示词同步
export async function POST(request) {
    try {
        const { start = 1, end = 278, force = false } = await request.json();
        
        // 检查是否需要更新（如果不是强制更新，检查上次更新时间）
        if (!force) {
            try {
                const stats = await fs.stat(PROMPTS_FILE);
                const lastModified = stats.mtime;
                const now = new Date();
                const daysSinceUpdate = (now - lastModified) / (1000 * 60 * 60 * 24);
                
                // 如果距离上次更新不到7天，跳过
                if (daysSinceUpdate < 7) {
                    const existing = await loadExistingPrompts();
                    return NextResponse.json({
                        success: true,
                        message: 'No update needed, last update was less than 7 days ago',
                        data: existing,
                        count: existing.length,
                        lastUpdated: lastModified.toISOString(),
                        skipped: true
                    });
                }
            } catch {
                // 文件不存在，继续执行更新
            }
        }
        
        
        
        // 抓取新的提示词
        const newPrompts = await scrapePrompts(start, end);
        
        
        // 加载现有数据并合并
        const existing = await loadExistingPrompts();
        const merged = mergePrompts(existing, newPrompts);
        
        // 保存合并后的数据
        await savePrompts(merged);
        
        
        
        return NextResponse.json({
            success: true,
            message: 'Prompts synced successfully',
            data: merged,
            count: merged.length,
            newCount: newPrompts.length,
            lastUpdated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Prompt sync error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// PUT: 手动触发同步（管理员功能）
export async function PUT(request) {
    try {
        const { adminKey } = await request.json();
        
        // 简单的管理员验证（在生产环境中应该使用更安全的方式）
        if (adminKey !== process.env.ADMIN_KEY) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }
        
        // 强制执行同步
        return POST(new Request(request.url, {
            method: 'POST',
            body: JSON.stringify({ force: true })
        }));
        
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
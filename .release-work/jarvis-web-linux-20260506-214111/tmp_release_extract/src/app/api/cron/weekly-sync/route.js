import { NextResponse } from 'next/server';
import { scrapePrompts, mergePrompts } from '@/lib/promptSeeder';
import fs from 'fs/promises';
import path from 'path';

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

// 每周定时同步任务
export async function GET(request) {
    try {
        // 验证请求来源（Vercel Cron Jobs）
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        
        
        // 抓取新的提示词（分批处理，避免超时）
        const batchSize = 50;
        const totalRange = 278;
        let allNewPrompts = [];
        
        for (let start = 1; start <= totalRange; start += batchSize) {
            const end = Math.min(start + batchSize - 1, totalRange);
            
            
            try {
                const batchPrompts = await scrapePrompts(start, end);
                allNewPrompts = allNewPrompts.concat(batchPrompts);
                
            } catch (error) {
                console.error(`Batch ${start}-${end} failed:`, error);
                // 继续处理下一批，不中断整个流程
            }
            
            // 批次间延迟
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        
        
        // 加载现有数据并合并
        const existing = await loadExistingPrompts();
        const merged = mergePrompts(existing, allNewPrompts);
        
        // 保存合并后的数据
        await savePrompts(merged);
        
        const result = {
            success: true,
            message: 'Weekly sync completed',
            timestamp: new Date().toISOString(),
            stats: {
                existingCount: existing.length,
                newCount: allNewPrompts.length,
                totalCount: merged.length,
                addedCount: merged.length - existing.length
            }
        };
        
        
        
        return NextResponse.json(result);
        
    } catch (error) {
        console.error('Weekly sync error:', error);
        
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

// 手动触发（用于测试）
export async function POST(request) {
    try {
        const { adminKey } = await request.json();
        
        if (adminKey !== process.env.ADMIN_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // 模拟Cron请求
        const cronRequest = new Request(request.url, {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${process.env.CRON_SECRET}`
            }
        });
        
        return GET(cronRequest);
        
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
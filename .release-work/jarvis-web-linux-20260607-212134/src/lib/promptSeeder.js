// PromptSeeder - Web版本
// 从aishort.top抓取提示词数据

const CANONICAL_CATEGORIES = [
    "写作辅助", "文章/报告", "IT/编程", "AI", "生活质量", "趣味科普", "生活百科", 
    "心理/社交", "哲学/宗教", "思维训练", "教育/学生", "学术/教师", "趣味游戏", 
    "效率工具", "终端/解释器", "语言/翻译", "辩论/演讲", "点评/评鉴", "文本/词语",
    "企业职能", "SEO", "医疗健康", "金融顾问", "音乐艺术", "专业顾问"
];

const TAG_SYNONYMS = {
    "语言": "语言/翻译", "翻译": "语言/翻译", "词典": "语言/翻译", "发音": "语言/翻译",
    "教育": "教育/学生", "学生": "教育/学生", "老师": "学术/教师", "考试": "教育/学生",
    "写作": "写作辅助", "文稿": "文章/报告", "论文": "文章/报告", "报告": "文章/报告",
    "IT": "IT/编程", "编程": "IT/编程", "前端": "IT/编程", "后端": "IT/编程",
    "工具": "效率工具", "办公": "效率工具", "效率": "效率工具",
    "娱乐": "趣味游戏", "游戏": "趣味游戏", "故事": "趣味游戏",
    "心理": "心理/社交", "社交": "心理/社交", "教练": "心理/社交",
    "AI": "AI", "提示词": "AI",
    "指南": "生活百科", "生活": "生活百科", "旅游": "生活百科", "旅行": "生活百科",
    "产品": "企业职能", "营销": "企业职能", "市场": "企业职能", "招聘": "企业职能", "HR": "企业职能",
    "医学": "医疗健康", "健康": "医疗健康", "医生": "医疗健康",
    "金融": "金融顾问", "理财": "金融顾问", "会计": "金融顾问",
    "音乐": "音乐艺术", "艺术": "音乐艺术", "绘画": "音乐艺术",
    "法律": "专业顾问", "顾问": "专业顾问", "律师": "专业顾问"
};

function extractBetween(html, startTag, endTag) {
    try {
        const startIndex = html.toLowerCase().indexOf(startTag.toLowerCase());
        if (startIndex === -1) return null;
        
        const gtIndex = html.indexOf('>', startIndex);
        const endIndex = html.toLowerCase().indexOf(endTag.toLowerCase(), gtIndex + 1);
        
        if (gtIndex === -1 || endIndex === -1) return null;
        
        return html.substring(gtIndex + 1, endIndex);
    } catch {
        return null;
    }
}

function htmlToPlain(html) {
    if (!html) return html;
    
    let result = '';
    let inTag = false;
    
    for (let i = 0; i < html.length; i++) {
        const char = html[i];
        if (char === '<') {
            inTag = true;
            continue;
        }
        if (char === '>') {
            inTag = false;
            continue;
        }
        if (!inTag) {
            result += char;
        }
    }
    
    return result
        .replace(/&nbsp;/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\n/g, '\n')
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .trim();
}

function extractTagsFromHtml(html) {
    const tags = [];
    let pos = 0;
    
    while (true) {
        const hrefIndex = html.toLowerCase().indexOf('/tags/', pos);
        if (hrefIndex === -1) break;
        
        const aStart = html.lastIndexOf('<a', hrefIndex);
        if (aStart === -1) {
            pos = hrefIndex + 6;
            continue;
        }
        
        const gt = html.indexOf('>', aStart);
        if (gt === -1) {
            pos = hrefIndex + 6;
            continue;
        }
        
        const aEnd = html.toLowerCase().indexOf('</a>', gt);
        if (aEnd === -1) {
            pos = hrefIndex + 6;
            continue;
        }
        
        const inner = html.substring(gt + 1, aEnd);
        const plainText = htmlToPlain(inner).trim();
        
        if (plainText) {
            tags.push(plainText);
        }
        
        pos = aEnd + 4;
    }
    
    return tags;
}

function mapTagToCanonical(tag) {
    if (!tag) return tag;
    
    const trimmed = tag.trim();
    
    // 直接匹配
    for (const cat of CANONICAL_CATEGORIES) {
        if (trimmed.toLowerCase() === cat.toLowerCase()) {
            return cat;
        }
    }
    
    // 同义词匹配
    if (TAG_SYNONYMS[trimmed]) {
        return TAG_SYNONYMS[trimmed];
    }
    
    return trimmed;
}

function parseAiShortPage(html) {
    // 提取标题
    let act = extractBetween(html, '<h1', '</h1>') || 
              extractBetween(html, '<h2', '</h2>') || 
              extractBetween(html, '<h3', '</h3>');
    
    if (act) {
        const gt = act.indexOf('>');
        if (gt >= 0) act = act.substring(gt + 1);
        act = act.trim();
    }
    
    // 提取Prompt内容
    const promptBlockIndex = html.toLowerCase().indexOf('prompt 内容');
    if (promptBlockIndex === -1) return null;
    
    const tail = html.substring(promptBlockIndex);
    let copyIndex = tail.indexOf('复制');
    if (copyIndex === -1) copyIndex = tail.toLowerCase().indexOf('copy');
    if (copyIndex === -1) return null;
    
    let prompt = tail.substring(copyIndex + 2);
    
    // 清理prompt内容
    const cuts = [
        prompt.toLowerCase().indexOf('copyright'),
        prompt.indexOf('$RC('),
        prompt.indexOf('登录')
    ].filter(i => i > 0);
    
    if (cuts.length > 0) {
        const cutAt = Math.min(...cuts);
        prompt = prompt.substring(0, cutAt);
    }
    
    prompt = htmlToPlain(prompt).trim();
    if (!prompt) return null;
    
    // 提取标签
    const tags = extractTagsFromHtml(html)
        .map(mapTagToCanonical)
        .filter(t => t && t.trim())
        .filter((tag, index, arr) => arr.indexOf(tag) === index); // 去重
    
    return {
        act: act || "未命名",
        prompt: prompt,
        tags: tags
    };
}

export async function scrapePrompts(start = 1, end = 278) {
    const items = [];
    
    for (let id = start; id <= end; id++) {
        try {
            const url = `https://www.aishort.top/prompt/${id}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                    'Accept-Language': 'zh-CN,zh;q=0.9'
                }
            });
            
            if (response.ok) {
                const html = await response.text();
                const item = parseAiShortPage(html);
                if (item) {
                    items.push(item);
                }
            }
        } catch (error) {
            
        }
        
        // 延迟避免过于频繁的请求
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return items;
}

export function mergePrompts(existing, newItems) {
    const all = [...existing, ...newItems];
    
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
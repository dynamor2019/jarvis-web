// ============================================================
// [CodeGuard Protection]
// Feature: hero-left-fix
// Version: 15
// Protected: 2026-04-12 17:54:50
// ============================================================
// [CodeGuard Feature Index]
// - use client -> line 11
// - const SCENARIOS: Scenario[] = [ -> line 30
// - const PROMISES = [ -> line 93
// - const USE_CASES = [ -> line 98
// - export default function Hero -> line 100
// [/CodeGuard Feature Index]

"use client";
import { useEffect, useState } from 'react';
import HeroRightRibbon from './HeroRightRibbon';

interface HeroProps {
    downloadUrl: string;
}

type Scenario = {
    tab: string;
    prompt: string;
    inputTag: string;
    inputLines: string[];
    outputTitle: string;
    outputTags: string[];
    providers: string[];
    stats: [string, string][];
};

const SCENARIOS: Scenario[] = [
    {
        tab: '万言文案秒成章',
        prompt: '从提纲、扩写到润色一步完成，万言内容直接落进 Word，不再手工拼段落',
        inputTag: '长文成章',
        inputLines: ['提纲：目标、受众、结构', '扩写：每章分段生成', '润色：语气统一与降重', '=> 一次输出万言成稿'],
        outputTitle: '万言文案成章.docx',
        outputTags: ['长文一气呵成', '结构自动成章', '交付无需拼接'],
        providers: ['OpenAI', 'Claude', 'DeepSeek'],
        stats: [['1次', '万言成章'], ['秒级', '落入 Word'], ['0拼接', '直接交稿']],
    },
    {
        tab: '全模通吃任意绑',
        prompt: '主流模型、本地模型和专用模型都能任意绑定，用同一套流程统一输出',
        inputTag: '任意绑定',
        inputLines: ['OpenAI：方案主稿', 'Claude：语气校对', 'DeepSeek：成本优化', '=> 任意组合统一出口'],
        outputTitle: '任意绑定方案.docx',
        outputTags: ['多模型任意绑', '统一工作流', '同口径输出'],
        providers: ['OpenAI', 'Claude', 'Gemini'],
        stats: [['全模', '都能接入'], ['任意', '自由组合'], ['1套', '统一出口']],
    },
    {
        tab: '高质低价随心换',
        prompt: '99% 功能免费开放，付费功能最低 9.9 元即可享受 100000 tokens；覆盖流量、订阅、买断三种模式，按需选择',
        inputTag: '流量 / 订阅 / 买断',
        inputLines: ['流量模式：按量付费，轻量上手', '订阅模式：免调试，开箱即用', '买断模式：一次购买，长期使用', '推广返利：赚取 Token 畅享 AI'],
        outputTitle: '预算友好版成稿.docx',
        outputTags: [],
        providers: ['DeepSeek', 'Qwen', 'Kimi'],
        stats: [['99%', '功能免费'], ['9.9元', '100000 tokens'], ['3模', '随心切换']],
    },
    {
        tab: '一键提效成倍涨',
        prompt: '标题、列表、段落、术语和空格批量统一，文档处理效率成倍提升',
        inputTag: '批量提效',
        inputLines: ['标题层级混乱', '列表缩进不一致', '术语前后不统一', '=> 一键统一全部格式'],
        outputTitle: '批量提效结果.docx',
        outputTags: ['一键批量处理', '提效成倍增长', '减少人工返工'],
        providers: ['OpenAI', 'DeepSeek', 'Qwen'],
        stats: [['2x+', '处理提速'], ['1键', '全局整理'], ['90%', '手工减少']],
    },
    {
        tab: '极简界面超高效',
        prompt: '界面轻、步骤短、入口清晰，需要时打开就用，不需要时不打断写作',
        inputTag: '极简高效',
        inputLines: ['一屏聚焦核心操作', '切换场景不跳页', '文档流转更顺手', '=> 低学习成本上手'],
        outputTitle: '极简高效工作流.docx',
        outputTags: ['界面极简', '上手成本低', '写作不打断'],
        providers: ['OpenAI', 'Claude', 'Kimi'],
        stats: [['极简', '更好上手'], ['高效', '更快完成'], ['低负担', '持续使用']],
    },
    {
        tab: '个性装饰乐活享',
        prompt: '主题色、封面感、重点标注和版面气质一键切换，让文档既好用，也更有记忆点',
        inputTag: '乐活装饰',
        inputLines: ['主题色：品牌联动', '封面样式：多风格可选', '重点内容：自动高亮', '=> 输出更有辨识度'],
        outputTitle: '乐活装饰方案.docx',
        outputTags: ['个性风格切换', '表达更有趣', '文档更有辨识度'],
        providers: ['OpenAI', 'Claude', 'Gemini'],
        stats: [['3套+', '风格模板'], ['1键', '完成切换'], ['乐活感', '更有吸引力']],
    },
];

const PROMISES = [
    { title: '升职加薪', desc: '方案交付比拼专业团队' },
    { title: '完善论文', desc: '结构、排版一次到位' },
    { title: '上班摸鱼', desc: '碎片时间也能快速出稿' },
];
const USE_CASES = ['论文', '方案', '合同协议', '招投标文件', '会议纪要', '产品需求', '行政材料'];

export default function Hero({ downloadUrl }: HeroProps) {
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [isRibbonHovered, setIsRibbonHovered] = useState(false);
    const scenarioCount = SCENARIOS.length;

    useEffect(() => {
        if (isRibbonHovered) {
            return;
        }

        const timer = setInterval(() => {
            setScenarioIndex((prev) => (prev + 1) % scenarioCount);
        }, 6200);

        return () => clearInterval(timer);
    }, [isRibbonHovered, scenarioCount]);

    return (
        <section className="relative overflow-hidden pt-8 pb-16 md:pt-10 md:pb-20 lg:pt-12 lg:pb-24">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.15),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />
            <div className="absolute right-[8%] top-[18%] -z-10 h-56 w-56 rounded-full bg-fuchsia-200/30 blur-3xl" />
            <div className="container relative z-10 mx-auto px-5">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(560px,1.12fr)] lg:gap-16">
                    <div className="max-w-[620px] space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/92 px-4 py-2 text-[13px] font-semibold text-indigo-700 shadow-[0_8px_24px_rgba(79,70,229,0.08)] backdrop-blur">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                            跃动在 Word 字里行间的 AI 智能体
                        </div>

                        <h1 className="max-w-[760px]" style={{ lineHeight: 1.08 }}>
                            <span className="block bg-[linear-gradient(90deg,#7c3aed_0%,#8b5cf6_22%,#b25af6_58%,#ec4899_100%)] bg-clip-text text-[40px] font-black tracking-[-0.035em] text-transparent md:text-[54px] lg:text-[66px]">
                                拥有小贾AI
                            </span>
                            <span className="mt-2 block bg-[linear-gradient(90deg,#7c3aed_0%,#8b5cf6_22%,#b25af6_58%,#ec4899_100%)] bg-clip-text text-[40px] font-black tracking-[-0.035em] text-transparent sm:whitespace-nowrap md:text-[54px] lg:text-[66px]">
                                WORD 文采卓尔不群
                            </span>
                        </h1>

                        <div className="hero-rainbow-border relative max-w-[620px] rounded-[24px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,247,237,0.92))] px-5 py-4 text-slate-700 shadow-[0_14px_40px_rgba(245,158,11,0.08)]">
                            <span className="hero-drop-in hero-drop-line-1 block text-[30px] font-black leading-[1.1] text-slate-900">99% 功能免费</span>
                            <span className="hero-drop-in hero-drop-line-2 mt-2 block text-[22px] font-semibold leading-tight">付费功能最低 9.9 元即可享受 100000 tokens</span>
                            <span className="hero-drop-in hero-drop-line-3 mt-2 block text-[20px] font-semibold leading-7">覆盖流量、订阅、买断三种模式，按需选择</span>
                        </div>

                        <div className="grid max-w-[640px] grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                            {PROMISES.map((item) => (
                                <div key={item.title} className="rounded-[22px] border border-slate-200 bg-white/88 px-4 py-4 text-sm leading-6 text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                                    <span className="block h-1.5 w-10 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#EC4899]" />
                                    <span className="mt-3 block text-[20px] font-black leading-7 text-slate-900">{item.title}</span>
                                    <span className="mt-1 block text-[15px] font-medium leading-6 text-slate-600">{item.desc}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glow-button inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-bold text-white no-underline hover:no-underline md:text-lg"
                            >
                                下载尊享
                                <span className="text-lg leading-none text-amber-300" aria-hidden="true">👑</span>
                            </a>
                            <a
                                href="/docs"
                                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition-all hover:border-[#4F46E5] hover:text-[#4F46E5] md:text-lg"
                            >
                                查看完整能力
                            </a>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 text-sm text-slate-600">
                            {USE_CASES.map((item) => (
                                <span key={item} className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 shadow-sm">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="relative lg:pl-2 lg:pt-2">
                        <div className="absolute inset-5 -z-10 rounded-[40px] bg-gradient-to-br from-indigo-200/65 via-sky-100/40 to-fuchsia-200/45 blur-3xl" />
                        <HeroRightRibbon
                            scenarios={SCENARIOS}
                            scenarioIndex={scenarioIndex}
                            onSelect={setScenarioIndex}
                            onHoverChange={setIsRibbonHovered}
                        />
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes heroHeavyDropLine1 {
                    0%, 19.99% { opacity: 0; transform: translateY(-28px) scale(1.03); }
                    20% { opacity: 0; transform: translateY(-28px) scale(1.03); }
                    29.6% { opacity: 1; transform: translateY(4px) scale(0.995); }
                    32% { opacity: 1; transform: translateY(0) scale(1); }
                    95%, 100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes heroHeavyDropLine2 {
                    0%, 24.19% { opacity: 0; transform: translateY(-28px) scale(1.03); }
                    24.2% { opacity: 0; transform: translateY(-28px) scale(1.03); }
                    33.8% { opacity: 1; transform: translateY(4px) scale(0.995); }
                    36.2% { opacity: 1; transform: translateY(0) scale(1); }
                    95%, 100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes heroHeavyDropLine3 {
                    0%, 28.59% { opacity: 0; transform: translateY(-28px) scale(1.03); }
                    28.6% { opacity: 0; transform: translateY(-28px) scale(1.03); }
                    38.2% { opacity: 1; transform: translateY(4px) scale(0.995); }
                    40.6% { opacity: 1; transform: translateY(0) scale(1); }
                    95%, 100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .hero-drop-in {
                    animation-duration: 10s;
                    animation-timing-function: cubic-bezier(0.22, 0.9, 0.24, 1);
                    animation-iteration-count: 3;
                    animation-fill-mode: both;
                    will-change: transform, opacity;
                }
                .hero-drop-line-1 {
                    animation-name: heroHeavyDropLine1;
                }
                .hero-drop-line-2 {
                    animation-name: heroHeavyDropLine2;
                }
                .hero-drop-line-3 {
                    animation-name: heroHeavyDropLine3;
                }
                @keyframes heroRainbowBorder {
                    0%, 19.99% { opacity: 0; }
                    20% { opacity: 0; }
                    24% { opacity: 1; }
                    70% { opacity: 1; }
                    75%, 100% { opacity: 1; }
                }
                .hero-rainbow-border::before,
                .hero-rainbow-border::after {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    border-radius: 26px;
                    pointer-events: none;
                    opacity: 0;
                    animation: heroRainbowBorder 10s ease-in-out 0s 3 forwards;
                }
                .hero-rainbow-border::before {
                    padding: 2px;
                    background: linear-gradient(110deg, #ff7a18 0%, #ffd200 18%, #7cff6b 36%, #39d8ff 56%, #6d5bff 76%, #ff4fd8 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                }
                .hero-rainbow-border::after {
                    inset: -5px;
                    background: linear-gradient(110deg, rgba(255,122,24,0.55) 0%, rgba(255,210,0,0.5) 18%, rgba(124,255,107,0.45) 36%, rgba(57,216,255,0.45) 56%, rgba(109,91,255,0.5) 76%, rgba(255,79,216,0.55) 100%);
                    filter: blur(10px);
                    z-index: -1;
                }
            `}</style>
        </section>
    );
}

// [CodeGuard Feature Index]
// - use client -> line 12
// - inputLines: ['OpenAI：方案主稿', 'Claude：语气校对', 'DeepSeek：成本优化', '... -> line 46
// - providers: ['OpenAI', 'Claude', 'Kimi -> line 79
// - <div className="max-w-[620px] space-y-6"> -> line 122
// - className="glow-button inline-flex items-center justify-cente... -> line 160
// - <div className="-mt-1 h-3 w-3 rotate-45 border-b border-r bor... -> line 211
// - <div className="h-20 rounded-[20px] border border-dashed bord... -> line 257
// - </section> -> line 315
// [/CodeGuard Feature Index]

"use client";
import { useEffect, useState } from 'react';
import NextImage from 'next/image';

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
        prompt: '覆盖流量、订阅、买断三种模式；订阅免调试开箱即用；推广可赚 Token，持续畅享 AI 能力',
        inputTag: '流量 / 订阅 / 买断',
        inputLines: ['流量模式：按量付费，轻量上手', '订阅模式：免调试，开箱即用', '买断模式：一次购买，长期使用', '推广返利：赚取 Token 畅享 AI'],
        outputTitle: '预算友好版成稿.docx',
        outputTags: ['三种付费模式', '订阅开箱即用', '推广赚 Token'],
        providers: ['DeepSeek', 'Qwen', 'Kimi'],
        stats: [['3模', '随心切换'], ['高质', '低价可得'], ['Token+', '推广可赚']],
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
    { title: '升职加薪', desc: '方案交付像专业团队' },
    { title: '完善论文', desc: '结构、排版一次到位' },
    { title: '上班摸鱼', desc: '碎片时间也能快速出稿' },
];
const USE_CASES = ['论文', '方案', '合同协议', '招投标文件', '会议纪要', '产品需求', '行政材料'];
const CORE_PROVIDERS = ['OpenAI', 'Claude', 'Gemini', 'Doubao', 'DeepSeek', 'Qwen', 'GLM', 'Kimi'];

export default function Hero({ downloadUrl }: HeroProps) {
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const scenarioCount = SCENARIOS.length;

    useEffect(() => {
        const timer = setInterval(() => {
            setScenarioIndex((prev) => (prev + 1) % scenarioCount);
        }, 6200);

        return () => clearInterval(timer);
    }, [scenarioCount]);

    const activeScenario = SCENARIOS[scenarioIndex];

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

                        <div className="max-w-[620px] rounded-[24px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,247,237,0.92))] px-5 py-4 text-base font-medium leading-8 text-slate-700 shadow-[0_14px_40px_rgba(245,158,11,0.08)]">
                            不是多一个聊天框，而是多一个真能替你撑场面的搭子。脑子里刚有想法，Word 里就已经开始像成稿。
                        </div>

                        <p className="max-w-[620px] text-[17px] leading-8 text-slate-600">
                            少一点来回搬运，少一点交稿前手忙脚乱。小贾AI 想做的是，把写作这件事从“勉强完成”变成“拿得出手”。
                        </p>

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
                        <div className="rounded-[34px] border border-slate-200/90 bg-white/94 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur">
                            <div className="rounded-[24px] border border-indigo-100/70 bg-[linear-gradient(180deg,rgba(249,251,255,0.95),rgba(242,246,255,0.9))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                                <p className="text-center text-[18px] font-semibold tracking-tight text-slate-800 md:text-[20px] lg:text-[22px] whitespace-nowrap">
                                    {activeScenario.tab}
                                </p>
                            </div>

                            <div key={activeScenario.tab} className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_156px_minmax(0,1fr)] lg:items-stretch">
                                <div className="flex min-h-[392px] h-full flex-col rounded-[28px] border border-indigo-100 bg-[linear-gradient(180deg,#f7f9ff_0%,#eef2ff_100%)] p-5 text-slate-800 shadow-[0_18px_44px_rgba(99,102,241,0.14)]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">输入区</span>
                                        <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs text-indigo-600 shadow-sm">{activeScenario.inputTag}</span>
                                    </div>
                                    <p className="mt-4 max-w-[320px] text-[15px] font-medium leading-7 text-slate-700">{activeScenario.prompt}</p>
                                    <div className="mt-5 flex-1 space-y-2 rounded-[22px] border border-indigo-100 bg-white/80 p-3.5 font-mono text-[13px] text-slate-600">
                                        {activeScenario.inputLines.map((line) => (
                                            <div key={line} className="rounded-xl border border-indigo-100 bg-white px-3 py-2.5">
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative flex min-h-[392px] flex-col items-center justify-start py-4">
                                    <div className="flex h-14 items-end">
                                        <div className="h-full w-px bg-gradient-to-b from-slate-200 via-slate-300 to-transparent" />
                                    </div>
                                    <div className="-mt-1 h-3 w-3 rotate-45 border-b border-r border-fuchsia-400/60" />
                                    <div className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">AI 输出直达 Word</div>
                                    <div className="mt-5 flex items-center justify-center animate-float">
                                        <NextImage
                                            src="/jarvisAI.svg"
                                            alt="Jarvis AI"
                                            width={112}
                                            height={112}
                                            unoptimized
                                            className="h-24 w-24 drop-shadow-[0_18px_34px_rgba(79,70,229,0.28)] md:h-28 md:w-28"
                                        />
                                    </div>
                                    <div className="mt-3 flex h-6 items-start">
                                        <div className="h-full w-px bg-gradient-to-b from-slate-200 via-slate-300 to-transparent" />
                                    </div>
                                    <div className="-mt-1 h-3 w-3 rotate-45 border-b border-r border-fuchsia-400/60" />
                                    <div className="mt-2 w-full max-w-[150px] rounded-[24px] border border-slate-200 bg-white/92 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                                        <p className="pb-2 text-center text-[11px] font-semibold tracking-[0.12em] text-slate-500">主力模型</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {CORE_PROVIDERS.map((provider) => (
                                                <div key={provider} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center text-[11px] font-semibold text-slate-600 shadow-sm">
                                                    {provider}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex min-h-[392px] h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">成稿区</span>
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">生成即排版，可继续编辑</span>
                                    </div>
                                    <div className="mt-5 flex-1 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4">
                                        <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-900">{activeScenario.outputTitle}</p>
                                            <div className="flex gap-1">
                                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                                                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            <div className="h-3 w-2/3 rounded-full bg-slate-900" />
                                            <div className="h-2 rounded-full bg-slate-200" />
                                            <div className="h-2 w-11/12 rounded-full bg-slate-200" />
                                            <div className="h-20 rounded-[20px] border border-dashed border-indigo-200 bg-white" />
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {activeScenario.outputTags.map((tag) => (
                                                <span key={tag} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-5 grid grid-cols-3 gap-3">
                                        {activeScenario.stats.map(([value, label], index) => (
                                            <div
                                                key={label}
                                                className="relative flex min-h-[92px] flex-col items-center justify-center overflow-hidden rounded-[22px] border border-indigo-100/70 bg-[linear-gradient(165deg,#ffffff_0%,#eef2ff_100%)] px-3 py-4 text-center shadow-[0_10px_24px_rgba(79,70,229,0.1)]"
                                            >
                                                <span className="absolute left-2.5 top-2.5 h-1.5 w-6 rounded-full bg-[linear-gradient(90deg,#4f46e5_0%,#d946ef_100%)] opacity-80" />
                                                <p className="bg-[linear-gradient(90deg,#4f46e5_0%,#7c3aed_50%,#d946ef_100%)] bg-clip-text text-[18px] font-extrabold leading-none tracking-[-0.02em] text-transparent md:text-[20px]">
                                                    {value}
                                                </p>
                                                <p className={`mt-1.5 text-[10px] font-medium ${index === 2 ? 'text-violet-600' : 'text-slate-600'}`}>
                                                    {label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 rounded-[18px] border border-slate-200/90 bg-white/75 px-3 py-3">
                                <div className="flex items-center justify-end">
                                    <span className="text-xs font-medium text-slate-500">{scenarioIndex + 1}/{scenarioCount}</span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/90">
                                    <div
                                        className="h-full rounded-full bg-[linear-gradient(90deg,#6d4bff_0%,#8b5cf6_46%,#d946ef_100%)] transition-all duration-500 ease-out"
                                        style={{ width: `${((scenarioIndex + 1) / scenarioCount) * 100}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-center gap-2">
                                    {SCENARIOS.map((scenario, index) => (
                                        <button
                                            key={scenario.tab}
                                            type="button"
                                            aria-label={`切换到${scenario.tab}`}
                                            onClick={() => setScenarioIndex(index)}
                                            className={`h-2.5 w-2.5 rounded-full transition-all ${
                                                index === scenarioIndex
                                                    ? 'scale-110 bg-[linear-gradient(90deg,#6d4bff_0%,#d946ef_100%)] shadow-[0_0_0_3px_rgba(139,92,246,0.15)]'
                                                    : 'bg-slate-300 hover:bg-slate-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

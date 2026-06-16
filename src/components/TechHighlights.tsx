"use client";
import { FormattedMessage } from 'react-intl';
import ProMonolineIcon from '@/components/ProMonolineIcon';
type HighlightIcon = 'lightning' | 'shield' | 'puzzle';
const highlights = [
    {
        title: "Web 前端工程",
        iconKey: "lightning" as HighlightIcon,
        color: "var(--google-blue)",
        features: [
            "React + TypeScript 组件化页面",
            "Next.js App Router 承载官网、商店和文档",
            "Tailwind 构建暗色玻璃 UI 与响应式布局"
        ]
    },
    {
        title: "Node 服务与数据链路",
        iconKey: "shield" as HighlightIcon,
        color: "var(--google-green)",
        features: [
            "Node / Next.js API 处理订单、模型和配置",
            "Token、订阅、智能体市场走统一权益校验",
            "前后端类型约束减少接口漂移"
        ]
    },
    {
        title: "Windows 插件底座",
        iconKey: "puzzle" as HighlightIcon,
        color: "var(--google-yellow)",
        features: [
            "C# VSTO 接入 Word 插件能力",
            "本地服务连接 Web 配置与 Office 工作流",
            "面向 Windows PC 的桌面端交付体验"
        ]
    }
];

const techStack = [
    ['React', '交互界面', '商店、首页、文档和模型选择'],
    ['TypeScript', '类型约束', '前端组件与接口数据更可控'],
    ['Node.js', '服务层', '订单、Token、配置和模型能力'],
    ['C# VSTO', 'Office 插件', 'Word 内 AI 写作与格式能力'],
    ['Security', '安全协议', 'HTTPS、签名、时间戳、设备绑定'],
    ['Crypto', '配置保护', '加密配置、本地校验、有效期控制'],
];

const architectureLayers = [
    {
        name: 'Web',
        title: 'React / TypeScript',
        desc: '官网、商店、文档、模型选择',
        color: '#60a5fa'
    },
    {
        name: 'Service',
        title: 'Node.js / Next.js API',
        desc: '订单、支付、Token、配置生成',
        color: '#34d399'
    },
    {
        name: 'PC',
        title: 'C# VSTO / Local Service',
        desc: 'Word 插件、本地校验、Office 工作流',
        color: '#fbbf24'
    }
];

export default function TechHighlights() {
    return (
        <section id="tech" className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden bg-[#07111f] py-5 text-white md:py-6" style={{ scrollMarginTop: '80px' }}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(59,130,246,0.18),transparent_32%)]" />
            <div className="pointer-events-none absolute inset-x-14 bottom-16 hidden h-64 rounded-[42px] border border-emerald-200/12 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.08),rgba(255,255,255,0.025))] lg:block">
                <img src="/assets/showcase/secure-work.jpg" alt="" className="absolute inset-0 h-full w-full rounded-[42px] object-cover opacity-16 mix-blend-luminosity" />
                <div className="absolute inset-0 rounded-[42px] bg-[linear-gradient(90deg,rgba(2,6,23,0.78),rgba(6,78,59,0.2),rgba(2,6,23,0.72))]" />
                <div className="absolute left-[18%] top-[35%] h-20 w-20 rounded-full border border-emerald-200/30 shadow-[0_0_54px_rgba(16,185,129,0.18)]" />
                <div className="absolute left-[46%] top-[18%] h-28 w-28 rounded-full border border-sky-200/25 shadow-[0_0_54px_rgba(56,189,248,0.18)]" />
                <div className="absolute right-[16%] top-[42%] h-16 w-16 rounded-full border border-amber-200/25 shadow-[0_0_54px_rgba(250,204,21,0.14)]" />
                <div className="absolute left-[22%] top-[50%] h-px w-[58%] bg-gradient-to-r from-emerald-200/70 via-sky-200/50 to-amber-200/60" />
            </div>
            <div className="container relative mx-auto px-4">
                <div className="mb-4">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-2 inline-flex rounded-full border border-emerald-200/20 bg-white/8 px-4 py-1 text-sm font-semibold text-emerald-100 shadow-sm backdrop-blur-xl">工程底座</div>
                        <h2 className="mb-2 text-4xl font-black leading-tight text-white md:text-5xl">
                            <FormattedMessage id="tech.heading.prefix" />
                            <span className="gradient-text"><FormattedMessage id="tech.heading.emphasis" /></span>
                        </h2>
                        <p className="mx-auto max-w-5xl whitespace-nowrap text-sm leading-6 text-slate-300">
                            <FormattedMessage id="tech.subtitle" />
                        </p>
                    </div>
                    <div className="mx-auto mt-4 grid max-w-3xl gap-3 sm:grid-cols-3">
                        {['Web 前端', 'Node 服务', 'C# VSTO'].map((item) => (
                            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2.5 text-center text-sm font-semibold text-emerald-50 backdrop-blur-xl">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[30px] border border-emerald-200/14 bg-slate-950/48 p-4 shadow-[0_34px_110px_rgba(2,6,23,0.38)] backdrop-blur-2xl md:p-5">
                    <img src="/assets/showcase/secure-work.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-10 mix-blend-luminosity" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.88),rgba(6,78,59,0.24),rgba(2,6,23,0.86))]" />
                    <div className="relative">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <div className="text-base font-semibold text-emerald-100">技术蓝图</div>
                                <div className="mt-1 text-sm leading-5 text-slate-300">三层架构独立协作，安全协议负责连接和保护。</div>
                            </div>
                            <div className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">架构视图</div>
                        </div>

                        <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
                            {architectureLayers.map((layer, index) => (
                                <div key={layer.name} className="contents">
                                    <div className="relative min-h-[170px] rounded-[22px] border border-white/10 bg-white/[0.06] p-5">
                                        <div className="absolute inset-x-8 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${layer.color}, transparent)` }} />
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/75">{layer.name}</div>
                                            <div className="h-3 w-3 rounded-full shadow-[0_0_18px_currentColor]" style={{ backgroundColor: layer.color, color: layer.color }} />
                                        </div>
                                        <div className="text-2xl font-black leading-tight text-white">{layer.title}</div>
                                        <div className="mt-2 text-sm font-medium leading-5 text-slate-200">{layer.desc}</div>
                                        <div className="mt-4 grid gap-2">
                                            {techStack.slice(index * 2, index * 2 + 2).map((item) => (
                                                <div key={item[0]} className="rounded-xl border border-white/10 bg-slate-950/38 px-3 py-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/70">{item[0]}</div>
                                                        <div className="text-base font-bold text-white">{item[1]}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {index < architectureLayers.length - 1 && (
                                        <div className="hidden items-center justify-center lg:flex">
                                            <div className="h-px w-10 bg-gradient-to-r from-emerald-200/20 via-emerald-200/80 to-emerald-200/20" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="rounded-[20px] border border-emerald-200/12 bg-emerald-300/8 p-3">
                                <div className="mb-2 text-xs font-semibold text-emerald-100">安全协议与配置保护</div>
                                <div className="grid gap-2 text-sm font-semibold text-slate-200 sm:grid-cols-3">
                                    {['HTTPS 传输', '签名校验', '时间戳防篡改'].map((item) => (
                                        <div key={item} className="rounded-xl border border-white/10 bg-slate-950/34 px-3 py-2 text-center">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-[20px] border border-white/10 bg-white/[0.055] p-3">
                                <div className="mb-2 text-xs font-semibold text-emerald-100">本地可信执行</div>
                                <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-200">
                                    {['设备绑定', '本地校验', '有效期控制', '错误码追踪'].map((item) => (
                                        <div key={item} className="rounded-xl bg-slate-950/34 px-3 py-2 text-center">
                                            {item}
                                        </div>
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

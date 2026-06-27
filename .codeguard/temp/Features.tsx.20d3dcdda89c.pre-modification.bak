"use client";
import { FormattedMessage } from 'react-intl';
import ProMonolineIcon from '@/components/ProMonolineIcon';

type FeatureIcon = 'ai' | 'formula' | 'assistant' | 'document';
const features = [
    {
        titleId: "features.list.0.title",
        iconKey: "ai" as FeatureIcon,
        items: [
            "features.list.0.item.0",
            "features.list.0.item.1",
            "features.list.0.item.2",
            "features.list.0.item.3",
        ],
        color: "#4F46E5"
    },
    {
        titleId: "features.list.1.title",
        iconKey: "formula" as FeatureIcon,
        items: [
            "features.list.1.item.0",
            "features.list.1.item.1",
            "features.list.1.item.2",
            "features.list.1.item.3",
        ],
        color: "#EC4899"
    },
    {
        titleId: "features.list.2.title",
        iconKey: "assistant" as FeatureIcon,
        items: [
            "features.list.2.item.0",
            "features.list.2.item.1",
            "features.list.2.item.2",
            "features.list.2.item.3",
        ],
        color: "#10B981"
    },
    {
        titleId: "features.list.3.title",
        iconKey: "document" as FeatureIcon,
        items: [
            "features.list.3.item.0",
            "features.list.3.item.1",
            "features.list.3.item.2",
            "features.list.3.item.3",
        ],
        color: "#F59E0B"
    }
];

const panelTags = [
    'features.panel.tag.0',
    'features.panel.tag.1',
    'features.panel.tag.2',
    'features.panel.tag.3',
];

const panelFooters = [
    'features.panel.footer.0',
    'features.panel.footer.1',
    'features.panel.footer.2',
];

export default function Features() {
    return (
        <section id="features" className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden bg-[#050816] py-12 text-white md:py-14" style={{ scrollMarginTop: '80px' }}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(236,72,153,0.22),transparent_28%),linear-gradient(180deg,#050816_0%,#0f172a_58%,#111827_100%)]" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[78%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
            <div className="pointer-events-none absolute -left-24 top-24 h-[420px] w-[420px] rounded-full border border-cyan-300/15" />
            <div className="pointer-events-none absolute right-[-10%] bottom-[-18%] h-[540px] w-[540px] rounded-full border border-fuchsia-300/15" />
            <div className="pointer-events-none absolute right-6 top-20 hidden h-[360px] w-[520px] overflow-hidden rounded-[36px] border border-cyan-200/15 bg-[radial-gradient(circle_at_22%_18%,rgba(94,234,212,0.28),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.2),rgba(255,255,255,0.05))] opacity-40 shadow-[0_40px_120px_rgba(8,47,73,0.34)] backdrop-blur-2xl lg:block">
                <img src="/assets/showcase/desk-system.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-26 mix-blend-luminosity" />
                <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.68),rgba(8,47,73,0.28),rgba(2,6,23,0.72))]" />
                <div className="absolute inset-8 rounded-[28px] border border-white/14 bg-slate-950/32" />
                <div className="absolute left-14 top-14 h-28 w-44 rounded-2xl border border-cyan-200/25 bg-cyan-300/10" />
                <div className="absolute bottom-14 right-14 h-36 w-56 rounded-3xl border border-fuchsia-200/25 bg-fuchsia-300/10" />
                <div className="absolute left-24 top-44 h-px w-80 rotate-[-18deg] bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
                <div className="absolute left-32 top-28 h-px w-72 rotate-[22deg] bg-gradient-to-r from-transparent via-fuchsia-200/70 to-transparent" />
            </div>
            <div className="container relative mx-auto px-4">
                <div className="grid items-stretch gap-8 lg:grid-cols-[0.96fr_1.04fr]">
                    <div className="flex h-full flex-col">
                        <div className="mb-4 inline-flex rounded-full border border-cyan-200/20 bg-white/8 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.16)] backdrop-blur-xl">
                            <FormattedMessage id="features.badge" defaultMessage="能力总览" />
                        </div>
                        <h2 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
                            <FormattedMessage id="features.heading.prefix" defaultMessage="核心" />
                            <span className="gradient-text"><FormattedMessage id="features.heading.emphasis" defaultMessage="特色" /></span>
                        </h2>
                        <p className="max-w-xl text-base leading-7 text-slate-300">
                            <FormattedMessage id="features.subtitle" defaultMessage="JarvisAI 提供全方位的写作辅助功能，让你的文档创作事半功倍" />
                        </p>

                        <div className="mt-7 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="group relative flex min-h-[210px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[0.08]"
                                >
                                    <div className="absolute inset-x-8 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${feature.color}, #22d3ee, transparent)` }} />
                                    <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full opacity-25 blur-2xl transition group-hover:opacity-45" style={{ backgroundColor: feature.color }} />
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-xs font-black text-white/35">0{index + 1}</span>
                                        <span
                                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                                            style={{ color: feature.color }}
                                        >
                                            <ProMonolineIcon className="h-6 w-6" variant={feature.iconKey} />
                                        </span>
                                    </div>
                                    <h3 className="mb-3 text-lg font-bold leading-tight text-white">
                                        <FormattedMessage id={feature.titleId} defaultMessage={feature.titleId} />
                                    </h3>
                                    <ul className="space-y-2 text-sm text-slate-300">
                                        {feature.items.slice(0, 2).map((item, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <span style={{ backgroundColor: feature.color }} className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full shadow-[0_0_14px_currentColor]" />
                                                <span className="leading-relaxed"><FormattedMessage id={item} defaultMessage={item} /></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex h-full flex-col overflow-hidden rounded-[36px] border border-cyan-200/14 bg-slate-950/50 p-7 shadow-[0_34px_110px_rgba(2,6,23,0.42)] backdrop-blur-2xl">
                        <img src="/assets/showcase/desk-system.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-6 mix-blend-luminosity" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(8,47,73,0.68),rgba(2,6,23,0.94))]" />
                        <div className="relative flex h-full flex-col">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <div className="text-lg font-semibold text-cyan-100">
                                        <FormattedMessage id="features.panel.title" defaultMessage="文档 AI 工作台" />
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-slate-300">
                                        <FormattedMessage id="features.panel.subtitle" defaultMessage="成稿、格式、全局输入和 Word/WPS 支持都收在一起。" />
                                    </div>
                                </div>
                                <div className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                    <FormattedMessage id="features.panel.badge" defaultMessage="一站式" />
                                </div>
                            </div>
                            <div className="flex-1 rounded-[28px] border border-white/10 bg-white/[0.055] p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-rose-300" />
                                    <span className="h-3 w-3 rounded-full bg-amber-300" />
                                    <span className="h-3 w-3 rounded-full bg-emerald-300" />
                                    <span className="ml-3 text-xs text-slate-400">JarvisAI / Word</span>
                                </div>
                                <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
                                    <div className="rounded-2xl border border-white/10 bg-slate-950/44 p-5">
                                        <div className="mb-4 h-4 w-40 rounded-full bg-cyan-200/30" />
                                        <div className="space-y-3">
                                            <div className="h-3 rounded-full bg-white/20" />
                                            <div className="h-3 w-5/6 rounded-full bg-white/16" />
                                            <div className="h-3 w-4/6 rounded-full bg-white/12" />
                                        </div>
                                        <div className="mt-6 rounded-2xl border border-cyan-200/18 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50">
                                            <FormattedMessage id="features.panel.body" defaultMessage="AI-generated content can go directly into the document, and can also be recalled in other input fields to keep writing." />
                                        </div>
                                    </div>
                                    <div className="grid gap-3">
                                        {panelTags.map((id) => (
                                            <div key={id} className="rounded-2xl border border-white/10 bg-white/[0.065] px-4 py-3 text-sm text-slate-200">
                                                <FormattedMessage id={id} defaultMessage={id.split('.').pop() || ''} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 grid grid-cols-3 gap-3">
                                {panelFooters.map((id) => (
                                    <div key={id} className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-4 text-center text-sm text-slate-200">
                                        <FormattedMessage id={id} defaultMessage={id.split('.').pop() || ''} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

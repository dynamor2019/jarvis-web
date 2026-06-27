"use client";
import { FormattedMessage } from 'react-intl';
import ProMonolineIcon from '@/components/ProMonolineIcon';
type QuickFeatureIcon = 'chat';
const steps = [
    {
        number: 1,
        titleId: "quick.steps.1.title",
        descriptionId: "quick.steps.1.desc"
    },
    {
        number: 2,
        titleId: "quick.steps.2.title",
        descriptionId: "quick.steps.2.desc"
    },
    {
        number: 3,
        titleId: "quick.steps.3.title",
        descriptionId: "quick.steps.3.desc"
    },
    {
        number: 4,
        titleId: "quick.steps.4.title",
        descriptionId: "quick.steps.4.desc"
    },
    {
        number: 5,
        titleId: "quick.steps.5.title",
        descriptionId: "quick.steps.5.desc"
    }
];

const specialFeatures = [
    {
        titleId: "quick.special.0.title",
        iconKey: "chat" as QuickFeatureIcon,
        color: "var(--google-blue)",
        items: [
            { titleId: "quick.special.0.item.0.title", descId: "quick.special.0.item.0.desc" },
            { titleId: "quick.special.0.item.1.title", descId: "quick.special.0.item.1.desc" },
            { titleId: "quick.special.0.item.2.title", descId: "quick.special.0.item.2.desc" },
            { titleId: "quick.special.0.item.3.title", descId: "quick.special.0.item.3.desc" },
            { titleId: "quick.special.0.item.4.title", descId: "quick.special.0.item.4.desc" },
            { titleId: "quick.special.0.item.5.title", descId: "quick.special.0.item.5.desc" }
        ]
    }
];

interface QuickStartProps {
    downloadUrl: string;
}

export default function QuickStart({ downloadUrl }: QuickStartProps) {
    return (
        <section id="start" className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden bg-[#050816] py-14 text-white md:py-16" style={{ scrollMarginTop: '80px' }}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(56,189,248,0.24),transparent_28%),radial-gradient(circle_at_86%_36%,rgba(236,72,153,0.22),transparent_30%),linear-gradient(180deg,#07111f_0%,#111827_52%,#050816_100%)]" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[72%] -translate-x-1/2 bg-gradient-to-r from-transparent via-fuchsia-300/60 to-transparent" />
            <div className="pointer-events-none absolute right-12 top-16 hidden h-[520px] w-[420px] rounded-[44px] border border-cyan-200/14 bg-[radial-gradient(circle_at_50%_18%,rgba(125,211,252,0.22),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.2),rgba(255,255,255,0.045))] shadow-[0_42px_130px_rgba(8,47,73,0.3)] backdrop-blur-2xl lg:block">
                <img src="/assets/showcase/writing-flow.jpg" alt="" className="absolute inset-0 h-full w-full rounded-[44px] object-cover opacity-16 mix-blend-luminosity" />
                <div className="absolute inset-0 rounded-[44px] bg-[linear-gradient(180deg,rgba(2,6,23,0.68),rgba(8,47,73,0.22),rgba(2,6,23,0.76))]" />
                <div className="absolute inset-8 rounded-[32px] border border-white/12 bg-slate-950/36" />
                <div className="absolute left-16 right-16 top-24 h-3 rounded-full bg-gradient-to-r from-cyan-200 via-fuchsia-200 to-sky-200" />
                <div className="absolute left-20 top-40 h-24 w-64 rounded-2xl border border-white/10 bg-white/8" />
                <div className="absolute left-20 top-72 h-24 w-64 rounded-2xl border border-white/10 bg-white/8" />
            </div>
            <div className="container mx-auto px-4">
                <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Left: Quick Start Steps */}
                    <div className="lg:col-span-2">
                        <h2 className="mb-6 text-4xl font-black tracking-tight md:text-5xl">
                            <FormattedMessage id="quick.heading.prefix" defaultMessage="快速" />
                            <span className="gradient-text"><FormattedMessage id="quick.heading.emphasis" defaultMessage="开始" /></span>
                        </h2>
                        <p className="text-slate-300 mb-8 leading-7">
                            <FormattedMessage id="quick.description" defaultMessage="只需5步，即可开始使用JarvisAI提升你的写作效率" />
                        </p>

                        <div className="rounded-[28px] border border-white/10 bg-white/[0.065] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
                            <ol className="space-y-6">
                                {steps.map((step) => (
                                    <li key={step.number} className="flex">
                                        <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold"
                                            style={{ 
                                                backgroundColor: step.number % 2 === 0 ? '#38BDF820' : '#EC489920',
                                                color: step.number % 2 === 0 ? '#67E8F9' : '#F9A8D4'
                                            }}
                                        >
                                            {step.number}
                                        </div>
                                        <div>
                                                <h4 className="font-semibold text-lg">
                                                <FormattedMessage id={step.titleId} defaultMessage={step.titleId} />
                                                </h4>
                                                <p className="text-slate-300">
                                                <FormattedMessage id={step.descriptionId} defaultMessage={step.descriptionId} />
                                                </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="mt-8 w-full rounded-full bg-white px-6 py-3 font-bold text-slate-950 shadow-[0_18px_38px_rgba(14,165,233,0.22)] inline-flex items-center justify-center transition hover:-translate-y-0.5">
                                <span className="inline-flex items-center justify-center gap-2">
                                    <ProMonolineIcon className="h-5 w-5" variant="download" />
                                    <FormattedMessage id="quick.download" defaultMessage="立即下载" />
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Right: Special Features */}
                    <div className="flex flex-col lg:col-span-3">
                        <h2 className="text-4xl font-bold mb-6">
                            <FormattedMessage id="quick.special.prefix" defaultMessage="特色" />
                            <span className="gradient-text"><FormattedMessage id="quick.special.emphasis" defaultMessage="功能" /></span>
                        </h2>

                        <div className="flex flex-1 flex-col space-y-6">
                            {specialFeatures.map((feature, index) => (
                                <div key={index} className="flex min-h-[420px] flex-1 flex-col rounded-[28px] border border-cyan-200/20 bg-white/[0.065] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
                                    <h3 
                                        className="text-xl font-semibold mb-4 flex items-center"
                                        style={{ color: '#67E8F9' }}
                                    >
                                        <span className="text-2xl mr-3 inline-flex">
                                            <ProMonolineIcon className="h-6 w-6" variant={feature.iconKey} />
                                        </span>
                                        <FormattedMessage id={feature.titleId} defaultMessage={feature.titleId} />
                                    </h3>
                                    <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {feature.items.map((item, i) => (
                                            <div key={i} className="flex min-h-[132px] flex-col rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                                                <h4 className="mb-3 border-b border-white/10 pb-3 text-base font-semibold text-white">
                                                    <FormattedMessage id={item.titleId} defaultMessage={item.titleId} />
                                                </h4>
                                                <p className="text-sm leading-6 text-slate-300">
                                                    <FormattedMessage id={item.descId} defaultMessage={item.descId} />
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

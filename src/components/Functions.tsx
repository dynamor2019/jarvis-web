"use client";
import { FormattedMessage } from 'react-intl';
import ProMonolineIcon from '@/components/ProMonolineIcon';
type ModuleIcon =
    | 'ai'
    | 'text'
    | 'paragraph'
    | 'table';
const functionModules = [
    {
        titleId: "functions.list.0.title",
        iconKey: "ai" as ModuleIcon,
        color: "#4F46E5",
        items: [
            "functions.list.0.item.0",
            "functions.list.0.item.1",
            "functions.list.0.item.2",
        ]
    },
    {
        titleId: "functions.list.1.title",
        iconKey: "text" as ModuleIcon,
        color: "#EC4899",
        items: [
            "functions.list.1.item.0",
            "functions.list.1.item.1",
            "functions.list.1.item.2",
        ]
    },
    {
        titleId: "functions.list.2.title",
        iconKey: "paragraph" as ModuleIcon,
        color: "#10B981",
        items: [
            "functions.list.2.item.0",
            "functions.list.2.item.1",
            "functions.list.2.item.2",
        ]
    },
    {
        titleId: "functions.list.3.title",
        iconKey: "table" as ModuleIcon,
        color: "#06B6D4",
        items: [
            "functions.list.3.item.0",
            "functions.list.3.item.1",
            "functions.list.3.item.2",
        ]
    }
];

const journey = [
    ['01', 'functions.journey.0.title', 'functions.journey.0.desc'],
    ['02', 'functions.journey.1.title', 'functions.journey.1.desc'],
    ['03', 'functions.journey.2.title', 'functions.journey.2.desc'],
    ['04', 'functions.journey.3.title', 'functions.journey.3.desc']
];

const footerTags = ['functions.footer.0', 'functions.footer.1', 'functions.footer.2'];

export default function Functions() {
    return (
        <section id="functions" className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden bg-[#111827] py-12 text-white md:py-14" style={{ scrollMarginTop: '64px' }}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(79,70,229,0.2),transparent_34%),radial-gradient(circle_at_82%_76%,rgba(34,211,238,0.14),transparent_32%),linear-gradient(180deg,#111827_0%,#07111f_100%)]" />
            <div className="pointer-events-none absolute inset-x-10 top-24 hidden h-[420px] rounded-[44px] border border-white/10 bg-[linear-gradient(115deg,rgba(34,211,238,0.08),rgba(236,72,153,0.08),rgba(255,255,255,0.03))] shadow-[0_38px_120px_rgba(2,6,23,0.35)] lg:block">
                <img src="/assets/showcase/team-flow.jpg" alt="" className="absolute inset-0 h-full w-full rounded-[44px] object-cover opacity-8 mix-blend-luminosity" />
                <div className="absolute inset-0 rounded-[44px] bg-[linear-gradient(90deg,rgba(2,6,23,0.78),rgba(15,23,42,0.38),rgba(2,6,23,0.76))]" />
                <div className="absolute left-[12%] top-1/2 h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_28px_rgba(103,232,249,0.9)]" />
                <div className="absolute left-[35%] top-[34%] h-3 w-3 rounded-full bg-fuchsia-200 shadow-[0_0_28px_rgba(244,114,182,0.8)]" />
                <div className="absolute left-[58%] top-[60%] h-3 w-3 rounded-full bg-emerald-200 shadow-[0_0_28px_rgba(110,231,183,0.8)]" />
                <div className="absolute left-[82%] top-[42%] h-3 w-3 rounded-full bg-sky-200 shadow-[0_0_28px_rgba(125,211,252,0.8)]" />
                <div className="absolute left-[13%] top-1/2 h-px w-[70%] bg-gradient-to-r from-cyan-200/70 via-fuchsia-200/45 to-sky-200/70" />
            </div>
            <div className="container relative mx-auto px-4">
                <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="order-2 lg:order-2">
                        <div className="mb-4 flex w-full justify-end">
                            <div className="w-full rounded-full border border-white/10 bg-white/8 px-4 py-2 text-center text-sm font-semibold text-cyan-100 backdrop-blur-xl sm:max-w-[468px]">
                                <FormattedMessage id="functions.badge" defaultMessage="工作流" />
                            </div>
                        </div>
                        <h2 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
                            <FormattedMessage id="functions.heading.prefix" />
                            <span className="gradient-text"><FormattedMessage id="functions.heading.emphasis" /></span>
                        </h2>
                        <p className="max-w-xl text-base leading-7 text-slate-300">
                            <FormattedMessage id="functions.subtitle" />
                        </p>

                        <div className="mt-7 grid gap-4 sm:grid-cols-2">
                            {functionModules.map((module, index) => (
                                <div key={index} className="relative rounded-[24px] border border-white/10 bg-slate-950/42 p-5 shadow-[0_24px_72px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.08]">
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10" style={{ color: module.color }}>
                                            <ProMonolineIcon className="h-6 w-6" variant={module.iconKey} />
                                        </span>
                                        <span className="text-sm font-black" style={{ color: module.color }}>0{index + 1}</span>
                                    </div>
                                    <h3 className="mb-3 text-lg font-bold text-white"><FormattedMessage id={module.titleId} defaultMessage={module.titleId} /></h3>
                                    <ul className="space-y-2 text-sm text-slate-300">
                                        {module.items.slice(0, 2).map((item, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: module.color }} />
                                                <span className="leading-relaxed"><FormattedMessage id={item} defaultMessage={item} /></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="order-1 relative overflow-hidden rounded-[36px] border border-cyan-200/14 bg-slate-950/50 p-7 shadow-[0_34px_110px_rgba(2,6,23,0.4)] backdrop-blur-2xl lg:order-1">
                        <img src="/assets/showcase/team-flow.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-6 mix-blend-luminosity" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.94),rgba(8,47,73,0.66),rgba(2,6,23,0.92))]" />
                        <div className="relative">
                            <div className="mb-6 flex items-center justify-between gap-5">
                                <div>
                                    <div className="text-lg font-semibold text-cyan-100">
                                <FormattedMessage id="functions.panel.title" defaultMessage="From pick to delivery" />
                            </div>
                            <div className="mt-2 text-sm leading-6 text-slate-300">
                                        <FormattedMessage id="functions.panel.subtitle" defaultMessage="From model and config to a finished Word document, the final screen gives users a clear closing moment and next step." />
                                    </div>
                                </div>
                                <div className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                                    <FormattedMessage id="functions.panel.badge" defaultMessage="Windows + Word" />
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {journey.map((step, index) => (
                                    <div key={step[0]} className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                                        {index < journey.length - 1 && <div className="absolute left-8 top-[62px] h-7 w-px bg-gradient-to-b from-cyan-200/70 to-transparent" />}
                                        <div className="flex gap-4">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-cyan-300/12 text-sm font-black text-cyan-100">{step[0]}</div>
                                            <div>
                                            <div className="text-lg font-semibold text-white"><FormattedMessage id={step[1]} defaultMessage={step[1]} /></div>
                                            <div className="mt-1.5 text-sm leading-6 text-slate-300"><FormattedMessage id={step[2]} defaultMessage={step[2]} /></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-3">
                                {footerTags.map((id) => (
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

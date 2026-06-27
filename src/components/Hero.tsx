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
import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import HeroRightRibbon from './HeroRightRibbon';

interface HeroProps {
    downloadUrl: string;
}

type Scenario = {
    tabId: string;
    promptId: string;
    inputTagId: string;
    inputLineIds: string[];
    outputTitleId: string;
    outputTagIds: string[];
    providers: string[];
    stats: [string, string][];
};

const SCENARIOS: Scenario[] = [
    {
        tabId: 'hero.ribbon.0.tab',
        promptId: 'hero.ribbon.0.prompt',
        inputTagId: 'hero.ribbon.0.input_tag',
        inputLineIds: ['hero.ribbon.0.line.0', 'hero.ribbon.0.line.1', 'hero.ribbon.0.line.2', 'hero.ribbon.0.line.3'],
        outputTitleId: 'hero.ribbon.0.output_title',
        outputTagIds: ['hero.ribbon.0.tag.0', 'hero.ribbon.0.tag.1', 'hero.ribbon.0.tag.2'],
        providers: ['OpenAI', 'Claude', 'DeepSeek'],
        stats: [['1次', 'hero.ribbon.0.stat.0'], ['秒级', 'hero.ribbon.0.stat.1'], ['0拼接', 'hero.ribbon.0.stat.2']],
    },
    {
        tabId: 'hero.ribbon.1.tab',
        promptId: 'hero.ribbon.1.prompt',
        inputTagId: 'hero.ribbon.1.input_tag',
        inputLineIds: ['hero.ribbon.1.line.0', 'hero.ribbon.1.line.1', 'hero.ribbon.1.line.2', 'hero.ribbon.1.line.3'],
        outputTitleId: 'hero.ribbon.1.output_title',
        outputTagIds: ['hero.ribbon.1.tag.0', 'hero.ribbon.1.tag.1', 'hero.ribbon.1.tag.2'],
        providers: ['OpenAI', 'Claude', 'Gemini'],
        stats: [['全模', 'hero.ribbon.1.stat.0'], ['任意', 'hero.ribbon.1.stat.1'], ['1套', 'hero.ribbon.1.stat.2']],
    },
    {
        tabId: 'hero.ribbon.2.tab',
        promptId: 'hero.ribbon.2.prompt',
        inputTagId: 'hero.ribbon.2.input_tag',
        inputLineIds: ['hero.ribbon.2.line.0', 'hero.ribbon.2.line.1', 'hero.ribbon.2.line.2', 'hero.ribbon.2.line.3'],
        outputTitleId: 'hero.ribbon.2.output_title',
        outputTagIds: [],
        providers: ['DeepSeek', 'Qwen', 'Kimi'],
        stats: [['99%', 'hero.ribbon.2.stat.0'], ['9.9元', 'hero.ribbon.2.stat.1'], ['3模', 'hero.ribbon.2.stat.2']],
    },
    {
        tabId: 'hero.ribbon.3.tab',
        promptId: 'hero.ribbon.3.prompt',
        inputTagId: 'hero.ribbon.3.input_tag',
        inputLineIds: ['hero.ribbon.3.line.0', 'hero.ribbon.3.line.1', 'hero.ribbon.3.line.2', 'hero.ribbon.3.line.3'],
        outputTitleId: 'hero.ribbon.3.output_title',
        outputTagIds: ['hero.ribbon.3.tag.0', 'hero.ribbon.3.tag.1', 'hero.ribbon.3.tag.2'],
        providers: ['OpenAI', 'DeepSeek', 'Qwen'],
        stats: [['2x+', 'hero.ribbon.3.stat.0'], ['1键', 'hero.ribbon.3.stat.1'], ['90%', 'hero.ribbon.3.stat.2']],
    },
    {
        tabId: 'hero.ribbon.4.tab',
        promptId: 'hero.ribbon.4.prompt',
        inputTagId: 'hero.ribbon.4.input_tag',
        inputLineIds: ['hero.ribbon.4.line.0', 'hero.ribbon.4.line.1', 'hero.ribbon.4.line.2', 'hero.ribbon.4.line.3'],
        outputTitleId: 'hero.ribbon.4.output_title',
        outputTagIds: ['hero.ribbon.4.tag.0', 'hero.ribbon.4.tag.1', 'hero.ribbon.4.tag.2'],
        providers: ['OpenAI', 'Claude', 'Kimi'],
        stats: [['极简', 'hero.ribbon.4.stat.0'], ['高效', 'hero.ribbon.4.stat.1'], ['低负担', 'hero.ribbon.4.stat.2']],
    },
    {
        tabId: 'hero.ribbon.5.tab',
        promptId: 'hero.ribbon.5.prompt',
        inputTagId: 'hero.ribbon.5.input_tag',
        inputLineIds: ['hero.ribbon.5.line.0', 'hero.ribbon.5.line.1', 'hero.ribbon.5.line.2', 'hero.ribbon.5.line.3'],
        outputTitleId: 'hero.ribbon.5.output_title',
        outputTagIds: ['hero.ribbon.5.tag.0', 'hero.ribbon.5.tag.1', 'hero.ribbon.5.tag.2'],
        providers: ['OpenAI', 'Claude', 'Gemini'],
        stats: [['3套+', 'hero.ribbon.5.stat.0'], ['1键', 'hero.ribbon.5.stat.1'], ['乐活感', 'hero.ribbon.5.stat.2']],
    },
];

const PROMISES = [
    { titleId: 'hero.promise.0.title', descId: 'hero.promise.0.desc' },
    { titleId: 'hero.promise.1.title', descId: 'hero.promise.1.desc' },
    { titleId: 'hero.promise.2.title', descId: 'hero.promise.2.desc' },
];
const USE_CASES = ['hero.usecase.0', 'hero.usecase.1', 'hero.usecase.2', 'hero.usecase.3', 'hero.usecase.4', 'hero.usecase.5', 'hero.usecase.6'];

export default function Hero({ downloadUrl }: HeroProps) {
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [isRibbonHovered, setIsRibbonHovered] = useState(false);
    const [pointer, setPointer] = useState({ x: 0, y: 0, active: 0 });
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

    const heroStyle = {
        '--hero-pointer-x': `${pointer.x}px`,
        '--hero-pointer-y': `${pointer.y}px`,
        '--hero-pointer-active': pointer.active,
    } as CSSProperties;

    const handlePointerMove = (event: MouseEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        setPointer({ x, y, active: 1 });
    };

    const handlePointerLeave = () => {
        setPointer({ x: 0, y: 0, active: 0 });
    };

    return (
        <section
            className="hero-stage relative overflow-hidden pt-8 pb-16 md:pt-10 md:pb-20 lg:pt-12 lg:pb-24"
            style={heroStyle}
            onMouseMove={handlePointerMove}
            onMouseLeave={handlePointerLeave}
        >
            <div className="hero-ambient absolute inset-0 -z-20" />
            <div className="hero-grid absolute inset-0 -z-20" />
            <div className="hero-depth-orbit hero-depth-orbit-one absolute -z-10" />
            <div className="hero-depth-orbit hero-depth-orbit-two absolute -z-10" />
            <div className="hero-light-field absolute inset-0 -z-10" aria-hidden="true">
                <div className="hero-light-ribbon hero-light-ribbon-one" />
                <div className="hero-light-ribbon hero-light-ribbon-two" />
                <div className="hero-light-ribbon hero-light-ribbon-three" />
            </div>
            <div className="container relative z-10 mx-auto px-5">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(560px,1.12fr)] lg:gap-16">
                    <div className="hero-copy max-w-[620px] space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-slate-950/45 px-4 py-2 text-[13px] font-semibold text-cyan-100 shadow-[0_12px_30px_rgba(8,47,73,0.24)] backdrop-blur-xl">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
                            <FormattedMessage id="hero.badge" defaultMessage="跃动在 Word 字里行间的 AI 智能体" />
                        </div>

                        <h1 className="max-w-[760px]" style={{ lineHeight: 1.08 }}>
                            <span className="block bg-[linear-gradient(92deg,#f8fafc_0%,#93c5fd_32%,#5eead4_66%,#f9a8d4_100%)] bg-clip-text text-[40px] font-black tracking-[-0.035em] text-transparent drop-shadow-[0_18px_44px_rgba(8,47,73,0.36)] md:text-[54px] lg:text-[66px]">
                                <FormattedMessage id="hero.title.line1" defaultMessage="拥有小贾AI" />
                            </span>
                            <span className="mt-2 block bg-[linear-gradient(92deg,#f8fafc_0%,#93c5fd_32%,#5eead4_66%,#f9a8d4_100%)] bg-clip-text text-[40px] font-black tracking-[-0.035em] text-transparent drop-shadow-[0_18px_44px_rgba(8,47,73,0.36)] sm:whitespace-nowrap md:text-[54px] lg:text-[66px]">
                                <FormattedMessage id="hero.title.line2" defaultMessage="WORD 文采卓尔不群" />
                            </span>
                        </h1>

                        <div className="hero-rainbow-border relative max-w-[620px] rounded-[24px] border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(15,23,42,0.74),rgba(15,23,42,0.42))] px-5 py-4 text-slate-200 shadow-[0_24px_70px_rgba(2,6,23,0.3)] backdrop-blur-xl">
                            <span className="hero-drop-in hero-drop-line-1 block text-[30px] font-black leading-[1.1] text-white"><FormattedMessage id="hero.value.0" defaultMessage="99% 功能免费" /></span>
                            <span className="hero-drop-in hero-drop-line-2 mt-2 block text-[22px] font-semibold leading-tight text-cyan-100"><FormattedMessage id="hero.value.1" defaultMessage="付费功能最低 9.9 元即可享受 100000 tokens" /></span>
                            <span className="hero-drop-in hero-drop-line-3 mt-2 block text-[20px] font-semibold leading-7 text-slate-300"><FormattedMessage id="hero.value.2" defaultMessage="覆盖流量、订阅、买断三种模式，按需选择" /></span>
                        </div>

                        <div className="grid max-w-[640px] grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                            {PROMISES.map((item) => (
                                <div key={item.titleId} className="hero-proof-card rounded-[22px] border border-cyan-200/20 bg-slate-950/35 px-4 py-4 text-sm leading-6 text-slate-300 shadow-[0_18px_46px_rgba(2,6,23,0.26)] backdrop-blur-xl">
                                    <span className="block h-1.5 w-10 rounded-full bg-gradient-to-r from-[#2563eb] via-[#06b6d4] to-[#ec4899]" />
                                    <span className="mt-3 block text-[20px] font-black leading-7 text-white"><FormattedMessage id={item.titleId} defaultMessage={item.titleId} /></span>
                                    <span className="mt-1 block text-[15px] font-medium leading-6 text-slate-300"><FormattedMessage id={item.descId} defaultMessage={item.descId} /></span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hero-primary-cta inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-bold text-white no-underline hover:no-underline md:text-lg"
                            >
                                <FormattedMessage id="hero.cta.download" defaultMessage="下载尊享" />
                                <span className="text-lg leading-none text-amber-300" aria-hidden="true">👑</span>
                            </a>
                            <a
                                href="/docs"
                                className="inline-flex items-center justify-center rounded-full border border-cyan-200/25 bg-slate-950/40 px-8 py-3.5 text-base font-semibold text-cyan-100 shadow-[0_12px_34px_rgba(2,6,23,0.24)] backdrop-blur-xl transition-all hover:border-cyan-200/60 hover:text-white md:text-lg"
                            >
                                <FormattedMessage id="hero.cta.view" defaultMessage="查看完整能力" />
                            </a>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 text-sm text-slate-300">
                            {USE_CASES.map((item) => (
                                <span key={item} className="rounded-full border border-cyan-200/20 bg-slate-950/30 px-3.5 py-1.5 shadow-sm backdrop-blur-xl">
                                    <FormattedMessage id={item} defaultMessage={item} />
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="hero-product-orbit relative lg:pl-2 lg:pt-2">
                        <div className="absolute inset-5 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_40%_16%,rgba(94,234,212,0.28),transparent_38%),linear-gradient(135deg,rgba(37,99,235,0.3),rgba(6,182,212,0.16),rgba(236,72,153,0.18))] blur-3xl" />
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
                .hero-stage {
                    --hero-pointer-x: 0px;
                    --hero-pointer-y: 0px;
                    --hero-pointer-active: 0;
                    min-height: calc(100vh - 76px);
                    isolation: isolate;
                    background: #020617;
                }
                .hero-ambient {
                    background:
                        radial-gradient(circle at calc(50% + var(--hero-pointer-x) * 0.12) calc(42% + var(--hero-pointer-y) * 0.12), rgba(125,211,252,calc(0.08 + var(--hero-pointer-active) * 0.18)), transparent 20%),
                        radial-gradient(circle at 14% 18%, rgba(37,99,235,0.36), transparent 31%),
                        radial-gradient(circle at 76% 22%, rgba(6,182,212,0.3), transparent 30%),
                        radial-gradient(circle at 86% 72%, rgba(236,72,153,0.22), transparent 32%),
                        linear-gradient(180deg, #020617 0%, #07111f 48%, #0b1020 82%, #0f172a 100%);
                }
                .hero-grid {
                    opacity: 0.42;
                    background-image:
                        linear-gradient(rgba(125,211,252,0.08) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(125,211,252,0.08) 1px, transparent 1px);
                    background-size: 72px 72px;
                    mask-image: radial-gradient(circle at 56% 36%, black 0%, transparent 70%);
                    transform: translate3d(calc(var(--hero-pointer-x) * -0.018), calc(var(--hero-pointer-y) * -0.018), 0);
                    transition: transform 140ms ease-out;
                }
                .hero-light-field {
                    pointer-events: none;
                    filter: saturate(1.1);
                    transform: translate3d(calc(var(--hero-pointer-x) * 0.025), calc(var(--hero-pointer-y) * 0.025), 0);
                    transition: transform 120ms ease-out;
                }
                .hero-light-ribbon {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: min(960px, 74vw);
                    height: 170px;
                    border-radius: 999px;
                    opacity: 0.72;
                    filter: blur(14px);
                    mix-blend-mode: screen;
                    will-change: transform;
                }
                .hero-light-ribbon::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.1) 12%, rgba(6,182,212,0.64) 38%, rgba(129,140,248,0.5) 62%, rgba(236,72,153,0.34) 84%, transparent 100%);
                }
                .hero-light-ribbon-one {
                    transform: translate(-47%, -55%) rotate(-18deg);
                    animation: heroRibbonFlowOne 12s ease-in-out infinite;
                }
                .hero-light-ribbon-two {
                    width: min(820px, 68vw);
                    height: 130px;
                    opacity: 0.5;
                    transform: translate(-24%, -8%) rotate(20deg);
                    animation: heroRibbonFlowTwo 15s ease-in-out infinite;
                }
                .hero-light-ribbon-three {
                    width: min(620px, 58vw);
                    height: 110px;
                    opacity: 0.42;
                    transform: translate(-72%, 64%) rotate(8deg);
                    animation: heroRibbonFlowThree 18s ease-in-out infinite;
                }
                .hero-depth-orbit {
                    border-radius: 999px;
                    border: 1px solid rgba(14,165,233,0.18);
                    box-shadow: inset 0 0 40px rgba(59,130,246,0.08), 0 0 54px rgba(14,165,233,0.09);
                }
                .hero-depth-orbit-one {
                    right: -10%;
                    top: 12%;
                    width: 520px;
                    height: 520px;
                    transform: rotate(-22deg) scaleX(1.3);
                }
                .hero-depth-orbit-two {
                    left: -14%;
                    bottom: 8%;
                    width: 380px;
                    height: 380px;
                    transform: rotate(18deg) scaleX(1.25);
                }
                .hero-copy,
                .hero-product-orbit {
                    animation: heroFloatIn 900ms cubic-bezier(0.22, 0.9, 0.22, 1) both;
                }
                .hero-product-orbit {
                    animation-delay: 120ms;
                }
                .hero-proof-card {
                    transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
                }
                .hero-proof-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(125,211,252,0.9);
                    box-shadow: 0 24px 48px rgba(15,23,42,0.12);
                }
                .hero-primary-cta {
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(92deg, #1d4ed8 0%, #06b6d4 48%, #db2777 100%);
                    box-shadow: 0 18px 42px rgba(37,99,235,0.28), 0 0 0 1px rgba(255,255,255,0.36) inset;
                    isolation: isolate;
                    transition: transform 220ms ease, box-shadow 220ms ease;
                }
                .hero-primary-cta::before {
                    content: '';
                    position: absolute;
                    inset: -120% -40%;
                    background: linear-gradient(120deg, transparent 36%, rgba(255,255,255,0.5) 50%, transparent 64%);
                    transform: translateX(-42%);
                    animation: heroCtaSweep 4.8s ease-in-out infinite;
                    z-index: -1;
                }
                .hero-primary-cta:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 22px 54px rgba(37,99,235,0.34), 0 0 0 1px rgba(255,255,255,0.44) inset;
                }
                .hero-primary-cta > * {
                    position: relative;
                    z-index: 1;
                }
                @keyframes heroRibbonFlowOne {
                    0%, 100% { transform: translate(-47%, -55%) rotate(-18deg) scale(1); }
                    50% { transform: translate(-43%, -62%) rotate(-12deg) scale(1.08); }
                }
                @keyframes heroRibbonFlowTwo {
                    0%, 100% { transform: translate(-24%, -8%) rotate(20deg) scale(1); }
                    50% { transform: translate(-29%, -2%) rotate(14deg) scale(1.06); }
                }
                @keyframes heroRibbonFlowThree {
                    0%, 100% { transform: translate(-72%, 64%) rotate(8deg) scale(1); }
                    50% { transform: translate(-66%, 58%) rotate(14deg) scale(1.1); }
                }
                @keyframes heroFloatIn {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes heroCtaSweep {
                    0%, 40% { transform: translateX(-42%) rotate(8deg); }
                    72%, 100% { transform: translateX(42%) rotate(8deg); }
                }
                @media (max-width: 768px) {
                    .hero-stage {
                        min-height: auto;
                    }
                    .hero-light-ribbon {
                        width: 118vw;
                        height: 110px;
                        filter: blur(18px);
                        opacity: 0.48;
                    }
                    .hero-light-ribbon-two,
                    .hero-light-ribbon-three,
                    .hero-depth-orbit-two,
                    .hero-depth-orbit-two {
                        display: none;
                    }
                    .hero-grid {
                        background-size: 48px 48px;
                        opacity: 0.28;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .hero-light-ribbon,
                    .hero-copy,
                    .hero-product-orbit,
                    .hero-primary-cta::before,
                    .hero-drop-in,
                    .hero-rainbow-border::before,
                    .hero-rainbow-border::after {
                        animation: none !important;
                    }
                    .hero-proof-card,
                    .hero-primary-cta {
                        transition: none;
                    }
                }
            `}</style>
        </section>
    );
}

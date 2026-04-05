"use client";
import NextImage from 'next/image';
import { FormattedMessage } from 'react-intl';

interface HeroProps {
    downloadUrl: string;
}

export default function Hero({ downloadUrl }: HeroProps) {
    return (
        <section className="relative py-12 md:py-16 lg:py-20">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center">
                    {/* Left Content */}
                    <div className="space-y-6 md:space-y-7">
                        <div className="inline-block px-3 py-1 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] font-medium text-xs md:text-sm">
                            <FormattedMessage id="hero.badge" defaultMessage="\u0041\u0049\u9a71\u52a8 \u00b7 \u004c\u0061\u0054\u0065\u0058\u652f\u6301 \u00b7 \u667a\u80fd\u5199\u4f5c" />
                        </div>

                        <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-shadow" style={{ lineHeight: 1.05 }}>
                            <FormattedMessage id="hero.title.line1" defaultMessage="\u5c0f\u8d3e\u0041\u0049 - \u667a\u80fd" />
                            <br />
                            <span className="gradient-text"><FormattedMessage id="hero.title.line2" defaultMessage="\u0057\u006f\u0072\u0064 \u0041\u0049\u667a\u80fd\u4f53" /></span>
                        </h1>

                        <p className="text-base md:text-lg text-gray-600 max-w-xl" style={{ lineHeight: 1.35 }}>
                            <FormattedMessage id="hero.tagline" defaultMessage="\u8ba9 \u0041\u0049 \u6210\u4e3a\u4f60\u7684\u5199\u4f5c\u4f19\u4f34\uff0c\u652f\u6301 \u004c\u0061\u0054\u0065\u0058 \u516c\u5f0f\u8f6c\u6362\uff0c\u8ba9\u6587\u6863\u7f16\u8f91\u66f4\u9ad8\u6548\u3001\u66f4\u4e13\u4e1a\uff0c\u91ca\u653e\u4f60\u7684\u521b\u9020\u529b\u3002" />
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 pt-3">
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="glow-button text-base md:text-lg px-6 py-2.5 rounded-full inline-flex items-center justify-center font-bold text-white no-underline hover:no-underline">
                                <FormattedMessage id="hero.cta.start" defaultMessage="\u5f00\u59cb\u4f7f\u7528 \u2192" />
                            </a>
                            <button className="border border-gray-300 px-6 py-2.5 rounded-full text-base md:text-lg font-medium hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all">
                                <FormattedMessage id="hero.cta.demo" defaultMessage="\u67e5\u770b\u6f14\u793a \u25b6" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <div className="flex -space-x-2">
                                <NextImage src="/globe.svg" alt="users" width={40} height={40} unoptimized className="w-9 h-9 rounded-full border-2 border-white bg-white p-1" />
                                <NextImage src="/next.svg" alt="users" width={40} height={40} unoptimized className="w-9 h-9 rounded-full border-2 border-white bg-white p-1" />
                                <NextImage src="/vercel.svg" alt="users" width={40} height={40} unoptimized className="w-9 h-9 rounded-full border-2 border-white bg-white p-1" />
                                <div className="w-9 h-9 rounded-full border-2 border-white bg-[#4F46E5]/10 flex items-center justify-center text-[#4F46E5] text-[11px] font-bold">500+</div>
                            </div>
                            <p className="text-sm text-gray-500"><FormattedMessage id="hero.users.using" defaultMessage="\u0035\u0030\u0030\u002b \u7528\u6237\u6b63\u5728\u4f7f\u7528 \u004a\u0061\u0072\u0076\u0069\u0073\u0041\u0049 \u63d0\u5347\u5199\u4f5c\u6548\u7387" /></p>
                        </div>
                    </div>

                    {/* Right: Stable visual block for production deploys */}
                    <div className="relative">
                        <div className="relative w-full overflow-hidden rounded-[28px] border border-[#4F46E5]/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(79,70,229,0.12)]">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#4F46E5]">
                                        <FormattedMessage id="hero.panel.label" defaultMessage="JarvisAI" />
                                    </p>
                                    <h3 className="mt-2 text-2xl font-bold text-gray-900">
                                        <FormattedMessage id="hero.panel.title" defaultMessage="智能写作工作台" />
                                    </h3>
                                </div>
                                <div className="rounded-full bg-[#4F46E5]/10 px-3 py-1 text-sm font-medium text-[#4F46E5]">
                                    <FormattedMessage id="hero.panel.status" defaultMessage="实时可用" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#FDF2F8] p-4">
                                    <p className="text-sm text-gray-500">
                                        <FormattedMessage id="hero.panel.card1.label" defaultMessage="文档助手" />
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">24/7</p>
                                    <p className="mt-3 text-sm text-gray-600">
                                        <FormattedMessage id="hero.panel.card1.desc" defaultMessage="润色、续写、摘要、翻译一体化" />
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-[#F0F9FF] p-4">
                                    <p className="text-sm text-gray-500">
                                        <FormattedMessage id="hero.panel.card2.label" defaultMessage="公式支持" />
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">LaTeX</p>
                                    <p className="mt-3 text-sm text-gray-600">
                                        <FormattedMessage id="hero.panel.card2.desc" defaultMessage="复杂公式转换与专业排版" />
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span><FormattedMessage id="hero.panel.footer.left" defaultMessage="当前能力" /></span>
                                    <span><FormattedMessage id="hero.panel.footer.right" defaultMessage="稳定运行" /></span>
                                </div>
                                <div className="mt-3 h-2 rounded-full bg-gray-200">
                                    <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-[#4F46E5] to-[#EC4899]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

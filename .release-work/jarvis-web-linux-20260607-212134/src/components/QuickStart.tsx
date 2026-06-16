"use client";
import ProMonolineIcon from '@/components/ProMonolineIcon';
type QuickFeatureIcon = 'chat';
const steps = [
    {
        number: 1,
        title: "安装 JarvisAI Word 插件",
        description: "下载安装包，按照指引完成安装"
    },
    {
        number: 2,
        title: "配置 AI API 密钥",
        description: "在设置中输入你的 API 密钥"
    },
    {
        number: 3,
        title: "点击圆形按钮展开",
        description: "在 Word 界面点击悬浮圆形助手"
    },
    {
        number: 4,
        title: "输入指令或选择功能",
        description: "使用各种强大的写作辅助功能"
    },
    {
        number: 5,
        title: "享受 AI 加持的写作体验",
        description: "提升效率，让写作更轻松"
    }
];

const specialFeatures = [
    {
        title: "提示词系统",
        iconKey: "chat" as QuickFeatureIcon,
        color: "var(--google-blue)",
        items: [
            { title: "内置模板", desc: "多种场景的提示词模板，一键使用" },
            { title: "历史记录", desc: "自动保存使用记录，快速调用" },
            { title: "自定义保存", desc: "保存常用提示词，打造个人库" }
        ]
    }
];

import { FormattedMessage } from 'react-intl';

interface QuickStartProps {
    downloadUrl: string;
}

export default function QuickStart({ downloadUrl }: QuickStartProps) {
    return (
        <section id="start" className="py-16 relative bg-gradient-to-br from-[#4F46E5]/5 to-[#EC4899]/5" style={{ scrollMarginTop: '80px' }}>
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Left: Quick Start Steps */}
                    <div className="lg:col-span-2">
                        <h2 className="text-4xl font-bold mb-6">
                            <FormattedMessage id="quick.heading.prefix" defaultMessage="快速" />
                            <span className="gradient-text"><FormattedMessage id="quick.heading.emphasis" defaultMessage="开始" /></span>
                        </h2>
                        <p className="text-gray-400 mb-8">
                            <FormattedMessage id="quick.description" defaultMessage="只需5步，即可开始使用JarvisAI提升你的写作效率" />
                        </p>

                        <div className="bg-white rounded-xl p-8 shadow-lg">
                            <ol className="space-y-6">
                                {steps.map((step) => (
                                    <li key={step.number} className="flex">
                                        <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold"
                                            style={{ 
                                                backgroundColor: `${step.number % 2 === 0 ? '#4F46E5' : '#EC4899'}20`,
                                                color: step.number % 2 === 0 ? '#4F46E5' : '#EC4899'
                                            }}
                                        >
                                            {step.number}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg">
                                                <FormattedMessage id={`quick.steps.${step.number}.title`} defaultMessage={step.title} />
                                            </h4>
                                            <p className="text-gray-600">
                                                <FormattedMessage id={`quick.steps.${step.number}.desc`} defaultMessage={step.description} />
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="mt-8 w-full glow-button py-3 rounded-full font-bold inline-flex items-center justify-center">
                                <span className="inline-flex items-center justify-center gap-2">
                                    <ProMonolineIcon className="h-5 w-5" variant="download" />
                                    <FormattedMessage id="quick.download" defaultMessage="立即下载" />
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Right: Special Features */}
                    <div className="lg:col-span-3">
                        <h2 className="text-4xl font-bold mb-6">
                            <FormattedMessage id="quick.special.prefix" defaultMessage="特色" />
                            <span className="gradient-text"><FormattedMessage id="quick.special.emphasis" defaultMessage="功能" /></span>
                        </h2>

                        <div className="space-y-6">
                            {specialFeatures.map((feature, index) => (
                                <div key={index} className="bg-white rounded-xl p-6 shadow-lg card-hover">
                                    <h3 
                                        className="text-xl font-semibold mb-4 flex items-center"
                                        style={{ color: feature.color }}
                                    >
                                        <span className="text-2xl mr-3 inline-flex">
                                            <ProMonolineIcon className="h-6 w-6" variant={feature.iconKey} />
                                        </span>
                                        <FormattedMessage id={`quick.special.${index}.title`} defaultMessage={feature.title} />
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {feature.items.map((item, i) => (
                                            <div key={i} className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium mb-2">
                                                    <FormattedMessage id={`quick.special.${index}.item.${i}.title`} defaultMessage={item.title} />
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    <FormattedMessage id={`quick.special.${index}.item.${i}.desc`} defaultMessage={item.desc} />
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

"use client";
type FeatureIcon = 'ai' | 'formula' | 'assistant' | 'document';
const features = [
    {
        title: "AI 智能助手",
        iconKey: "ai" as FeatureIcon,
        items: [
            "智能改写：让内容更流畅专业",
            "智能续写：基于上下文自动续写",
            "智能摘要：快速提取文档要点",
            "智能翻译：多语言无缝转换"
        ],
        color: "#4F46E5"
    },
    {
        title: "LaTeX 公式转换",
        iconKey: "formula" as FeatureIcon,
        items: [
            "一键转换：LaTeX 代码转 MathML",
            "自动编号：公式自动编号 (1)(2)(3)",
            "复杂支持：矩阵、分段函数、积分",
            "专业布局：公式居中，编号右对齐"
        ],
        color: "#EC4899"
    },
    {
        title: "悬浮圆形助手",
        iconKey: "assistant" as FeatureIcon,
        items: [
            "Mac 风格设计：精致圆形悬浮按钮",
            "智能展开：胶囊形输入框",
            "黄金比例：自适应屏幕宽度",
            "一键唤醒：右键丰富功能菜单"
        ],
        color: "#10B981"
    },
    {
        title: "智能文档处理",
        iconKey: "document" as FeatureIcon,
        items: [
            "一键格式：智能识别并统一格式",
            "完美排版：标题层级自动修正",
            "批量处理：表格、图片、文本优化",
            "专业输出：生成目录、导出PDF"
        ],
        color: "#F59E0B"
    }
];

import { FormattedMessage } from 'react-intl';
import ProMonolineIcon from '@/components/ProMonolineIcon';

export default function Features() {
    return (
        <section id="features" className="pt-2 pb-4 md:pt-3 md:pb-6 relative bg-gray-50" style={{ scrollMarginTop: '80px' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-4xl font-bold mb-3">
                        <FormattedMessage id="features.heading.prefix" defaultMessage="核心" />
                        <span className="gradient-text"><FormattedMessage id="features.heading.emphasis" defaultMessage="特色" /></span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-base">
                        <FormattedMessage id="features.subtitle" defaultMessage="JarvisAI 提供全方位的写作辅助功能，让你的文档创作事半功倍" />
                    </p>
                    <div className="w-20 h-1 bg-[#4F46E5] mx-auto mt-6 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg card-hover border border-gray-100 transition-all duration-300"
                        >
                            <div className="p-4 text-white font-semibold rounded-t-xl flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)` }}>
                                <span
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: "#ffffff1a" }}
                                >
                                    <ProMonolineIcon className="h-7 w-7" variant={feature.iconKey} />
                                </span>
                                <h3 className="font-semibold leading-tight text-white inline-flex items-center px-3 py-1.5 rounded-lg" style={{ background: `linear-gradient(315deg, ${feature.color}dd, ${feature.color})` }}>
                                    <span className="text-base font-medium whitespace-nowrap">
                                        <FormattedMessage id={`features.list.${index}.title`} defaultMessage={feature.title} />
                                    </span>
                                </h3>
                            </div>
                            <ul className="p-5 space-y-3 text-gray-700 text-sm bg-gradient-to-b from-gray-50/50 to-white">
                                {feature.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <span style={{ color: feature.color }} className="flex-shrink-0 mt-0.5 font-bold text-lg">&bull;</span>
                                        <span className="leading-relaxed"><FormattedMessage id={`features.list.${index}.item.${i}`} defaultMessage={item} /></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

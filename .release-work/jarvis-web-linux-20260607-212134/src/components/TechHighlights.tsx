"use client";
import ProMonolineIcon from '@/components/ProMonolineIcon';
type HighlightIcon = 'lightning' | 'shield' | 'puzzle';
const highlights = [
    {
        title: "Performance",
        iconKey: "lightning" as HighlightIcon,
        color: "var(--google-blue)",
        features: [
            "Streaming output",
            "Token management",
            "Async processing"
        ]
    },
    {
        title: "Reliability",
        iconKey: "shield" as HighlightIcon,
        color: "var(--google-green)",
        features: [
            "Encrypted API key",
            "Config diagnostics",
            "Error logs"
        ]
    },
    {
        title: "Extensibility",
        iconKey: "puzzle" as HighlightIcon,
        color: "var(--google-yellow)",
        features: [
            "Multiple AI providers",
            "Theme package system",
            "Plugin architecture"
        ]
    }
];
import { FormattedMessage } from 'react-intl';

export default function TechHighlights() {
    return (
        <section id="tech" className="pt-4 pb-8 md:pt-6 md:pb-10 relative" style={{ scrollMarginTop: '80px' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-7">
                    <h2 className="text-4xl md:text-4xl font-bold leading-tight mb-3">
                        <FormattedMessage id="tech.heading.prefix" />
                        <span className="gradient-text"><FormattedMessage id="tech.heading.emphasis" /></span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        <FormattedMessage id="tech.subtitle" />
                    </p>
                    <div className="w-20 h-1 bg-[#4F46E5] mx-auto mt-4 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {highlights.map((highlight, index) => (
                        <div 
                            key={index} 
                            className="bg-white rounded-xl p-6 shadow-lg card-hover"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <span 
                                    className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                                    style={{ backgroundColor: `${highlight.color}20` }}
                                >
                                    <ProMonolineIcon className="h-8 w-8" variant={highlight.iconKey} />
                                </span>
                                <h3 className="font-semibold">
                                    <span className="text-base font-medium whitespace-nowrap">
                                        <FormattedMessage id={`tech.list.${index}.title`} defaultMessage={highlight.title} />
                                    </span>
                                </h3>
                            </div>
                            <ul className="space-y-2 text-gray-600">
                                {highlight.features.map((feature, i) => (
                                    <li key={i} className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span><FormattedMessage id={`tech.list.${index}.item.${i}`} defaultMessage={feature} /></span>
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


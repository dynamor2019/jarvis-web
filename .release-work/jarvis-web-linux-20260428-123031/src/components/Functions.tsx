"use client";
type ModuleIcon =
    | 'ai'
    | 'text'
    | 'paragraph'
    | 'table'
    | 'image'
    | 'library'
    | 'formula'
    | 'productivity';
const functionModules = [
    {
        title: "AI Tools",
        iconKey: "ai" as ModuleIcon,
        color: "#4F46E5",
        items: [
            "Smart rewrite",
            "Smart continue",
            "Smart summary",
            "Smart translation"
        ]
    },
    {
        title: "Text Tools",
        iconKey: "text" as ModuleIcon,
        color: "#EC4899",
        items: [
            "One-click format",
            "Chinese-English layout",
            "Cleanup spaces and breaks",
            "Case and conversion"
        ]
    },
    {
        title: "Paragraph",
        iconKey: "paragraph" as ModuleIcon,
        color: "#10B981",
        items: [
            "Title hierarchy",
            "Indent control",
            "Line spacing",
            "Paragraph spacing"
        ]
    },
    {
        title: "Table Tools",
        iconKey: "table" as ModuleIcon,
        color: "#F59E0B",
        items: [
            "Insert table",
            "Table-text convert",
            "Three-line table",
            "Header and cross-page"
        ]
    },
    {
        title: "Image Tools",
        iconKey: "image" as ModuleIcon,
        color: "#EF4444",
        items: [
            "Insert and extract",
            "Auto adjust",
            "Align and resize",
            "Compress and keep quality"
        ]
    },
    {
        title: "Document Tools",
        iconKey: "library" as ModuleIcon,
        color: "#8B5CF6",
        items: [
            "Generate TOC",
            "Unified font",
            "Doc statistics",
            "Export PDF"
        ]
    },
    {
        title: "LaTeX",
        iconKey: "formula" as ModuleIcon,
        color: "#DC2626",
        items: [
            "LaTeX to formula",
            "Auto numbering",
            "Complex formulas",
            "Professional layout"
        ]
    },
    {
        title: "Productivity",
        iconKey: "productivity" as ModuleIcon,
        color: "#06B6D4",
        items: [
            "Floating clipboard",
            "Screen capture",
            "Token center",
            "Plugin marketplace"
        ]
    }
];

import { FormattedMessage } from 'react-intl';
import ProMonolineIcon from '@/components/ProMonolineIcon';

export default function Functions() {
    return (
        <section id="functions" className="pt-3 pb-3 md:pt-4 md:pb-4 relative" style={{ scrollMarginTop: '64px' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-7">
                    <h2 className="text-4xl md:text-4xl font-bold mb-3">
                        <FormattedMessage id="functions.heading.prefix" />
                        <span className="gradient-text"><FormattedMessage id="functions.heading.emphasis" /></span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-base">
                        <FormattedMessage id="functions.subtitle" />
                    </p>
                    <div className="w-20 h-1 bg-[#4F46E5] mx-auto mt-4 rounded-full"></div>
                </div>

                {/* Main Function Modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-1">
                    {functionModules.map((module, index) => {
                        return (
                            <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 card-hover border border-gray-100">
                                {/* Header with icon and title */}
                                <div 
                                    className="p-4 text-white font-semibold rounded-t-xl"
                                    style={{ background: `linear-gradient(135deg, ${module.color}, ${module.color}dd)` }}
                                >
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `linear-gradient(315deg, ${module.color}dd, ${module.color})` }}>
                                        <span className="text-3xl flex-shrink-0 inline-flex">
                                            <ProMonolineIcon className="h-8 w-8" variant={module.iconKey} />
                                        </span>
                                        <span className="text-base font-medium whitespace-nowrap"><FormattedMessage id={`functions.list.${index}.title`} defaultMessage={module.title} /></span>
                                    </div>
                                </div>
                                {/* Items list */}
                                <div className="p-5 bg-gradient-to-b from-gray-50/50 to-white">
                                    <ul className="space-y-3 text-gray-700 text-sm">
                                        {module.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <span style={{ color: module.color }} className="flex-shrink-0 mt-0.5 font-bold text-lg">&bull;</span>
                                                <span className="leading-relaxed"><FormattedMessage id={`functions.list.${index}.item.${i}`} defaultMessage={item} /></span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}

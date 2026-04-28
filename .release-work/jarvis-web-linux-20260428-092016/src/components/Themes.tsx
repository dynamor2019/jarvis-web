"use client";
import ProMonolineIcon from '@/components/ProMonolineIcon';
import { FormattedMessage } from 'react-intl';
type BuiltinThemeIcon = 'spark' | 'theme' | 'pet' | 'palette' | 'pro' | 'assistant';
const builtinThemes = [
    { name: "Theme A", iconKey: "spark" as BuiltinThemeIcon, gradient: "from-pink-100 to-pink-200", textColor: "text-pink-600" },
    { name: "Theme B", iconKey: "theme" as BuiltinThemeIcon, gradient: "from-gray-700 to-gray-900", textColor: "text-gray-300" },
    { name: "Theme C", iconKey: "pet" as BuiltinThemeIcon, gradient: "from-green-100 to-green-200", textColor: "text-green-600" },
    { name: "Theme D", iconKey: "palette" as BuiltinThemeIcon, gradient: "from-purple-100 to-purple-200", textColor: "text-purple-600" },
    { name: "Theme E", iconKey: "pro" as BuiltinThemeIcon, gradient: "from-gray-50 to-gray-100", textColor: "text-gray-700" },
    { name: "Theme F", iconKey: "assistant" as BuiltinThemeIcon, gradient: "from-blue-100 to-blue-200", textColor: "text-blue-600" }
];
const themeFeatures = [
    "Material border style",
    "Custom avatar icon",
    "Theme package import/export",
    "Auto color extraction"
];
const decorationFeatures = [
    "Float above the window",
    "Multiple animation effects"
];
export default function Themes() {
    return (
        <section id="themes" className="pt-4 pb-6 md:pt-6 md:pb-8 relative bg-gray-50" style={{ scrollMarginTop: '80px' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-7">
                    <h2 className="text-4xl md:text-4xl font-bold leading-tight mb-3">
                        <FormattedMessage id="themes.heading.prefix" />
                        <span className="gradient-text"><FormattedMessage id="themes.heading.emphasis" /></span>
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        <FormattedMessage id="themes.subtitle" />
                    </p>
                    <div className="w-20 h-1 bg-[#06B6D4] mx-auto mt-4 rounded-full"></div>
                </div>

                {/* Built-in Themes */}
                <div className="mb-10">
                    <h3 className="text-2xl font-semibold mb-4 text-center"><FormattedMessage id="themes.builtin.title" /></h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {builtinThemes.map((theme, index) => (
                            <div 
                                key={index} 
                                className="bg-white rounded-xl overflow-hidden shadow-md card-hover cursor-pointer"
                            >
                                <div className={`h-20 bg-gradient-to-br ${theme.gradient}`}></div>
                                <div className="p-4 text-center">
                                    <span className={`font-medium text-sm ${theme.textColor}`}>
                                        <span className="inline-flex items-center gap-2">
                                            <ProMonolineIcon className="h-4 w-4" variant={theme.iconKey} />
                                            <FormattedMessage id={`themes.builtin.${index}`} defaultMessage={theme.name} />
                                        </span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Theme Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
                        <h3 className="text-xl font-semibold mb-4 flex items-center text-[#4F46E5]">
                            <span className="text-2xl mr-3 inline-flex"><ProMonolineIcon className="h-6 w-6" variant="settings" /></span>
                            <FormattedMessage id="themes.features.title" />
                        </h3>
                        <ul className="space-y-2 text-gray-600">
                            {themeFeatures.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="text-[#EC4899] mr-2">★</span>
                                    <span><FormattedMessage id={`themes.features.item.${index}`} defaultMessage={feature} /></span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 h-20 bg-gray-50 rounded-xl overflow-hidden">
                            <img
                                src="/assets/theme-feature.gif"
                                alt="主题特征演示"
                                className="h-full w-full object-contain object-center"
                            />
                        </div>
                    </div>

                    {/* Desktop Decorations */}
                    <div className="bg-white rounded-xl p-6 shadow-lg card-hover relative overflow-hidden">
                        <h3 className="text-xl font-semibold mb-4 flex items-center text-[#06B6D4]">
                            <span className="text-2xl mr-3 inline-flex"><ProMonolineIcon className="h-6 w-6" variant="pet" /></span>
                            <FormattedMessage id="themes.decoration.title" />
                        </h3>

                        {/* Animation Demo */}
                        <div className="h-40 bg-gray-50 rounded-xl relative overflow-hidden mb-4">
                            <img
                                src="/assets/desktop-widget-full.gif"
                                alt="desktop widget demo"
                                className="h-full w-full object-contain"
                                style={{ clipPath: 'inset(0 2px 0 0)' }}
                            />
                        </div>

                        <ul className="space-y-2 text-gray-600">
                            {decorationFeatures.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="text-[#06B6D4] mr-2">★</span>
                                    <span><FormattedMessage id={`themes.decoration.item.${index}`} defaultMessage={feature} /></span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}


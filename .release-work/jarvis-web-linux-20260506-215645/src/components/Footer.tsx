"use client";
const footerLinks = {
    product: [
        { name: "功能介绍", href: "#features" },
        { name: "使用教程", href: "#start" },
        { name: "价格方案", href: "/dashboard" },
        { name: "更新日志", href: "#" }
    ],
    support: [
        { name: "帮助中心", href: "#" },
        { name: "联系我们", href: "/feedback" },
        { name: "常见问题", href: "#" },
        { name: "API文档", href: "#" }
    ],
    legal: [
        { name: "隐私政策", href: "#" },
        { name: "服务条款", href: "#" },
        { name: "Cookie政策", href: "#" },
        { name: "知识产权", href: "#" }
    ]
};

const socialLinks = [
    { icon: "🐙", name: "GitHub", href: "#" },
    { icon: "🐦", name: "Twitter", href: "#" },
    { icon: "💬", name: "WeChat", href: "#" }
];

import { FormattedMessage } from 'react-intl';

export default function Footer() {
    return (
        <footer className="bg-[#1E293B] text-white py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--google-blue)] to-[var(--google-red)] flex items-center justify-center text-white font-bold">
                                J
                            </div>
                            <h2 className="text-xl font-bold">JarvisAI</h2>
                        </div>
                        <p className="text-gray-400 mb-4 text-sm">
                            <FormattedMessage id="footer.tagline" defaultMessage="智能Word写作助手，让AI赋能你的文档创作" />
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social, index) => (
                                <a 
                                    key={index}
                                    href={social.href} 
                                    className="text-2xl hover:scale-110 transition-transform"
                                    title={social.name}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4"><FormattedMessage id="footer.section.product" defaultMessage="产品" /></h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            {footerLinks.product.map((link, index) => (
                                <li key={index}>
                                    <a href={link.href} className="hover:text-white transition-colors">
                                        <FormattedMessage id={`footer.links.product.${index}`} defaultMessage={link.name} />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4"><FormattedMessage id="footer.section.support" defaultMessage="支持" /></h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            {footerLinks.support.map((link, index) => (
                                <li key={index}>
                                    <a href={link.href} className="hover:text-white transition-colors">
                                        <FormattedMessage id={`footer.links.support.${index}`} defaultMessage={link.name} />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4"><FormattedMessage id="footer.section.legal" defaultMessage="法律" /></h3>
                        <ul className="space-y-2 text-gray-400 text-sm">
                            {footerLinks.legal.map((link, index) => (
                                <li key={index}>
                                    <a href={link.href} className="hover:text-white transition-colors">
                                        <FormattedMessage id={`footer.links.legal.${index}`} defaultMessage={link.name} />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500">
                    <FormattedMessage id="footer.copyright" defaultMessage="© 2025 Jarvis AI. All rights reserved." />
                </div>
            </div>
        </footer>
    );
}

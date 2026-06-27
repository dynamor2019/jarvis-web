"use client";

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

interface DocSection {
  id: string;
  icon: string;
  color: string;
  subsections: {
    id: string;
    featureCount: number;
  }[];
}

const docSections: DocSection[] = [
  {
    id: 'writing',
    icon: '✍️',
    color: '#4F46E5',
    subsections: [
      { id: 'ai-generation', featureCount: 4 },
      { id: 'prompt-system', featureCount: 4 },
      { id: 'content-expansion', featureCount: 4 }
    ]
  },
  {
    id: 'latex',
    icon: '📐',
    color: '#DC2626',
    subsections: [
      { id: 'latex-conversion', featureCount: 4 },
      { id: 'math-symbols', featureCount: 4 },
      { id: 'equation-numbering', featureCount: 4 }
    ]
  },
  {
    id: 'formatting',
    icon: '🎨',
    color: '#EC4899',
    subsections: [
      { id: 'one-click-format', featureCount: 4 },
      { id: 'body-format', featureCount: 5 },
      { id: 'heading-format', featureCount: 4 },
      { id: 'table-format', featureCount: 5 },
      { id: 'header-footer', featureCount: 4 }
    ]
  },
  {
    id: 'table-tools',
    icon: '📊',
    color: '#10B981',
    subsections: [
      { id: 'remove-indent', featureCount: 4 },
      { id: 'table-management', featureCount: 4 }
    ]
  },
  {
    id: 'content-tools',
    icon: '🛠️',
    color: '#F59E0B',
    subsections: [
      { id: 'text-cleanup', featureCount: 4 },
      { id: 'image-tools', featureCount: 4 },
      { id: 'pdf-tools', featureCount: 4 }
    ]
  },
  {
    id: 'settings',
    icon: '⚙️',
    color: '#8B5CF6',
    subsections: [
      { id: 'api-settings', featureCount: 4 },
      { id: 'plugin-settings', featureCount: 4 },
      { id: 'preset-management', featureCount: 4 }
    ]
  },
  {
    id: 'advanced',
    icon: '🚀',
    color: '#06B6D4',
    subsections: [
      { id: 'batch-processing', featureCount: 4 },
      { id: 'plugin-system', featureCount: 4 },
      { id: 'automation', featureCount: 4 }
    ]
  }
];

export default function DocsContent() {
  const [expandedSection, setExpandedSection] = useState<string | null>('writing');
  const [expandedSubsection, setExpandedSubsection] = useState<string | null>('ai-generation');

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 bg-[linear-gradient(92deg,#f8fafc_0%,#93c5fd_38%,#5eead4_72%,#f9a8d4_100%)] bg-clip-text text-5xl font-black text-transparent">
            <FormattedMessage id="docs.title" defaultMessage="插件使用说明" />
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-8 text-slate-300">
            <FormattedMessage 
              id="docs.subtitle" 
              defaultMessage="详细的功能指南和使用教程，帮助你充分利用 JarvisAI 的所有功能"
            />
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-cyan-200/15 bg-slate-950/44 p-6 shadow-[0_24px_72px_rgba(0,0,0,0.26)] backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-bold text-white">
                <FormattedMessage id="docs.categories" defaultMessage="功能分类" />
              </h3>
              <nav className="space-y-2">
                {docSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setExpandedSection(section.id);
                      setExpandedSubsection(section.subsections[0]?.id || null);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      expandedSection === section.id
                        ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold'
                        : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    <FormattedMessage id={`docs.section.${section.id}.title`} />
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {docSections.map((section) => (
              expandedSection === section.id && (
                <div key={section.id} className="space-y-6">
                  {/* Section Header */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.065] p-8 shadow-[0_24px_72px_rgba(0,0,0,0.24)] backdrop-blur-xl" style={{ borderLeftColor: section.color, borderLeftWidth: 4 }}>
                    <h2 className="mb-2 flex items-center text-4xl font-bold text-white">
                      <span className="text-4xl mr-3">{section.icon}</span>
                      <FormattedMessage id={`docs.section.${section.id}.title`} />
                    </h2>
                    <p className="text-slate-300">
                      <FormattedMessage 
                        id={`docs.section.${section.id}.desc`}
                      />
                    </p>
                  </div>

                  {/* Subsections */}
                  <div className="space-y-4">
                    {section.subsections.map((subsection) => (
                      <div
                        key={subsection.id}
                        className={`overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] shadow-[0_18px_54px_rgba(0,0,0,0.22)] transition-all cursor-pointer hover:bg-white/[0.085] ${
                          expandedSubsection === subsection.id ? 'ring-2' : ''
                        }`}
                        
                        onClick={() => setExpandedSubsection(
                          expandedSubsection === subsection.id ? null : subsection.id
                        )}
                      >
                        <div className="bg-white/[0.04] p-6">
                          <h3 className="text-2xl font-bold text-white">
                            <FormattedMessage id={`docs.section.${section.id}.sub.${subsection.id}.title`} />
                          </h3>
                          <p className="mt-2 text-slate-300">
                            <FormattedMessage id={`docs.section.${section.id}.sub.${subsection.id}.desc`} />
                          </p>
                        </div>

                        {expandedSubsection === subsection.id && (
                          <div className="border-t border-white/10 bg-slate-950/24 px-6 py-4">
                            <h4 className="mb-4 font-semibold text-white">
                              <FormattedMessage id="docs.features" defaultMessage="主要功能" />
                            </h4>
                            <ul className="space-y-3">
                              {Array.from({ length: subsection.featureCount }).map((_, index) => (
                                <li key={index} className="flex items-start">
                                  <span 
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 flex-shrink-0 text-white text-sm font-bold"
                                    style={{ backgroundColor: section.color }}
                                  >
                                    ✓
                                  </span>
                                  <span className="text-slate-300">
                                    <FormattedMessage id={`docs.section.${section.id}.sub.${subsection.id}.feat.${index}`} />
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-16 rounded-xl border border-cyan-200/15 bg-slate-950/42 p-8 shadow-[0_24px_72px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <h3 className="mb-4 flex items-center text-2xl font-bold text-white">
            <span className="text-2xl mr-3">💡</span>
            <FormattedMessage id="docs.tips.title" defaultMessage="使用提示" />
          </h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start">
              <span className="mr-3">•</span>
              <span>
                <FormattedMessage 
                  id="docs.tips.1" 
                  defaultMessage="首次使用前，请在设置中配置你的 API 密钥"
                />
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">•</span>
              <span>
                <FormattedMessage 
                  id="docs.tips.2" 
                  defaultMessage="使用一键格式设置可以快速统一文档格式"
                />
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">•</span>
              <span>
                <FormattedMessage 
                  id="docs.tips.3" 
                  defaultMessage="LaTeX 转换：选中 LaTeX 代码后点击转换按钮，公式会自动编号"
                />
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">•</span>
              <span>
                <FormattedMessage 
                  id="docs.tips.4" 
                  defaultMessage="保存常用的提示词和格式预设，提高工作效率"
                />
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">•</span>
              <span>
                <FormattedMessage 
                  id="docs.tips.5" 
                  defaultMessage="定期检查插件更新，获取最新功能和改进"
                />
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

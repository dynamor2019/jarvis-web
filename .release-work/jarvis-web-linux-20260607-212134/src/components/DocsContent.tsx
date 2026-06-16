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
          <h1 className="text-5xl font-bold mb-4">
            <FormattedMessage id="docs.title" defaultMessage="插件使用说明" />
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            <FormattedMessage 
              id="docs.subtitle" 
              defaultMessage="详细的功能指南和使用教程，帮助你充分利用 JarvisAI 的所有功能"
            />
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">
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
                        ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
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
                  <div className="bg-white rounded-xl shadow-lg p-8 border-l-4" style={{ borderColor: section.color }}>
                    <h2 className="text-4xl font-bold mb-2 flex items-center">
                      <span className="text-4xl mr-3">{section.icon}</span>
                      <FormattedMessage id={`docs.section.${section.id}.title`} />
                    </h2>
                    <p className="text-gray-600">
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
                        className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all cursor-pointer hover:shadow-xl ${
                          expandedSubsection === subsection.id ? 'ring-2' : ''
                        }`}
                        
                        onClick={() => setExpandedSubsection(
                          expandedSubsection === subsection.id ? null : subsection.id
                        )}
                      >
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
                          <h3 className="text-2xl font-bold text-gray-900">
                            <FormattedMessage id={`docs.section.${section.id}.sub.${subsection.id}.title`} />
                          </h3>
                          <p className="text-gray-600 mt-2">
                            <FormattedMessage id={`docs.section.${section.id}.sub.${subsection.id}.desc`} />
                          </p>
                        </div>

                        {expandedSubsection === subsection.id && (
                          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <h4 className="font-semibold text-gray-900 mb-4">
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
                                  <span className="text-gray-700">
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
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border-l-4 border-blue-500">
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <span className="text-2xl mr-3">💡</span>
            <FormattedMessage id="docs.tips.title" defaultMessage="使用提示" />
          </h3>
          <ul className="space-y-3 text-gray-700">
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

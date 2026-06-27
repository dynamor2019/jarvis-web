// [CodeGuard Feature Index]
// - props and scenario type definitions -> line 11
// - scenario cards map rendering loop -> line 61
// - scenario intro prompt and tags block -> line 85
// - budget preview block for idx=2 -> line 93
// - fallback core stats block -> line 150
// [/CodeGuard Feature Index]

﻿import React from 'react';

type Scenario = {
  tab: string;
  prompt: string;
  outputTags: string[];
  stats: [string, string][];
};

type HeroRightRibbonProps = {
  scenarios: Scenario[];
  scenarioIndex: number;
  onSelect: (index: number) => void;
  onHoverChange?: (hovered: boolean) => void;
};

const RIBBON_COLORS = [
  'linear-gradient(180deg, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0.08) 100%)',
  'linear-gradient(180deg, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.08) 100%)',
  'linear-gradient(180deg, rgba(217,70,239,0.22) 0%, rgba(217,70,239,0.08) 100%)',
  'linear-gradient(180deg, rgba(79,70,229,0.20) 0%, rgba(236,72,153,0.10) 100%)',
  'linear-gradient(180deg, rgba(45,212,191,0.20) 0%, rgba(99,102,241,0.08) 100%)',
  'linear-gradient(180deg, rgba(59,130,246,0.20) 0%, rgba(168,85,247,0.10) 100%)',
];

const PROVIDER_LOGOS = [
  { name: 'OpenAI', src: 'https://cdn.oaistatic.com/assets/favicon-l4nq08hd.svg' },
  { name: 'Anthropic', src: 'https://cdn.simpleicons.org/anthropic/111827' },
  { name: 'Gemini', src: 'https://cdn.simpleicons.org/googlegemini/1d4ed8' },
  { name: 'DeepSeek', src: '/deepseek-logo.ico' },
  { name: 'Kimi', src: 'https://icon.horse/icon/kimi.moonshot.cn' },
  { name: 'Qwen', src: 'https://icon.horse/icon/qwenlm.ai' },
  { name: 'Doubao', src: 'https://cdn.jsdelivr.net/gh/lobehub/lobe-icons@master/packages/static-png/dark/volcengine-color.png' },
  { name: 'Zhipu', src: 'https://icon.horse/icon/bigmodel.cn' },
];

export default function HeroRightRibbon({ scenarios, scenarioIndex, onSelect, onHoverChange }: HeroRightRibbonProps) {
  const activeScenario = scenarios[scenarioIndex] ?? scenarios[0];

  return (
    <div className="rounded-[34px] border border-slate-200/90 bg-white/94 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="rounded-[24px] border border-indigo-100/70 bg-[linear-gradient(180deg,rgba(249,251,255,0.95),rgba(242,246,255,0.9))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <p className="text-center text-[18px] font-semibold tracking-tight text-slate-800 md:text-[20px] lg:text-[22px] whitespace-nowrap">
          {activeScenario?.tab}
        </p>
      </div>

      <div className="mt-4 h-[460px] rounded-[24px] border border-indigo-100/70 bg-[linear-gradient(180deg,rgba(249,251,255,0.95),rgba(242,246,255,0.9))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div
          className="flex h-full w-full gap-2"
          onMouseLeave={() => onHoverChange?.(false)}
        >
          {scenarios.map((scenario, idx) => {
            const isActive = idx === scenarioIndex;
            const showAllModelLogos = idx === 1;
            const showBudgetPreview = idx === 2;
            const showEfficiencyPreview = idx === 3;
            const showTextGenPreview = idx === 0;
            const budgetSegments = [
              '99% 功能免费',
              '付费功能最低 9.9 元即可享受 100000 tokens',
              '覆盖流量、订阅、买断三种模式，按需选择',
            ];
            return (
              <button
                key={`${scenario.tab}-${idx}`}
                type="button"
                onClick={() => onSelect(idx)}
                onMouseEnter={() => {
                  onSelect(idx);
                  onHoverChange?.(true);
                }}
                className={`group relative h-full overflow-hidden rounded-[16px] border border-indigo-100/70 text-left transition-all duration-700 ease-out ${isActive ? 'flex-[1.8] shadow-[0_18px_40px_rgba(99,102,241,0.2)]' : 'flex-[0.32] shadow-[0_8px_18px_rgba(99,102,241,0.08)]'}`}
                style={{ background: RIBBON_COLORS[idx % RIBBON_COLORS.length] }}
                aria-label={`切换到${scenario.tab}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_55%)]" />
                {isActive ? (
                  <div className="relative z-10 h-full p-1.5">
                    <div className={`w-full rounded-[14px] border border-indigo-100/90 bg-white/95 p-3 shadow-[0_10px_24px_rgba(30,41,59,0.14)] ${showEfficiencyPreview || showBudgetPreview ? 'h-auto' : 'h-full flex flex-col'}`}>
                      <div>
                        <p className="text-[12px] font-semibold tracking-[0.08em] text-slate-500">场景简介</p>
                        {showBudgetPreview ? (
                          <div className="mt-2 space-y-1.5 text-slate-800">
                            <p className="text-[26px] font-black leading-[1.08]">
                              {budgetSegments[0]}
                            </p>
                            <p className="text-[20px] font-semibold leading-tight">
                              {budgetSegments[1]}
                            </p>
                            <p className="text-[16px] font-semibold leading-7">
                              {budgetSegments[2]}
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="mt-1.5 line-clamp-3 text-[16px] font-semibold leading-7 text-slate-800">{scenario.prompt}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {scenario.outputTags.slice(0, 3).map((tag) => (
                                <span key={tag} className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[13px] font-medium text-indigo-700">{tag}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {showBudgetPreview && (
                        <div className="mt-3 rounded-xl border border-indigo-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f6ff_100%)] p-2.5">
                          <p className="text-center text-[14px] font-bold text-indigo-600">小贾电站</p>
                          <p className="mt-1 text-center text-[11px] text-slate-600">选择合适方案，开启 AI 写作之旅</p>
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <span className="text-[11px] text-slate-600">支付方式:</span>
                            <span className="rounded-md bg-[#2b63f6] px-2 py-1 text-[11px] font-semibold text-white">微信支付</span>
                            <span className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">支付宝</span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[10px] font-medium text-slate-700">
                            {['订阅服务', '流量服务', '终身', '智能体市场', '天赋点亮', '已购项目'].map((tab) => (
                              <span key={tab} className="rounded-md border border-slate-200 bg-white px-1.5 py-1">
                                {tab}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {showEfficiencyPreview && (
                        <div className="mt-3 rounded-xl border border-indigo-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f6ff_100%)] p-2.5">
                          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5">
                            <span className="h-3 w-3 rounded-sm bg-[#2b63f6]" />
                            <span className="text-[11px] font-semibold text-slate-700">一键格式设置</span>
                          </div>
                          <div className="mt-2 rounded-md border border-slate-200 bg-white p-2">
                            <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-1 text-[10px] font-semibold text-slate-600">
                              <span>字体</span>
                              <span>字号</span>
                              <span>行距</span>
                            </div>
                            <div className="mt-1 space-y-1">
                              {[
                                ['H1', '宋体', '22 (二号)'],
                                ['H2', '黑体', '12 (小四)'],
                                ['H3', '宋体', '10.5 (五号)'],
                              ].map(([level, font, size]) => (
                                <div key={level} className="grid grid-cols-[0.5fr_1.2fr_1fr_1fr] items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-1">
                                  <span className="text-[10px] font-bold text-indigo-700">{level}</span>
                                  <span className="text-[10px] text-slate-700">{font}</span>
                                  <span className="text-[10px] text-slate-700">{size}</span>
                                  <span className="text-[10px] text-slate-700">单倍</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {showTextGenPreview && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-indigo-100 bg-white">
                          <img
                            src="/assets/textgen.gif"
                            alt="万言文案秒成章演示"
                            className="h-[210px] w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      {!showBudgetPreview && !showEfficiencyPreview && !showTextGenPreview && (
                        <div className="mt-3 flex-1 space-y-2">
                          <p className="text-[12px] font-semibold tracking-[0.08em] text-slate-500">核心指标</p>
                          {scenario.stats.map(([value, label]) => (
                            <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/90 px-2.5 py-2">
                              <span className="text-[14px] font-bold text-indigo-700">{value}</span>
                              <span className="text-[13px] font-medium text-slate-700">{label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {showAllModelLogos && (
                        <div className="mt-3 border-t border-slate-200 pt-2.5">
                          <div className="grid grid-cols-4 gap-2">
                            {PROVIDER_LOGOS.map((model) => (
                              <div key={model.name} className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white">
                                <img
                                  src={model.src}
                                  alt={model.name}
                                  className="h-4 w-4 object-contain opacity-90"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                  }}
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex h-full items-center justify-center px-1">
                    <span
                      className="select-none whitespace-nowrap bg-[linear-gradient(180deg,#4f46e5_0%,#7c3aed_46%,#d946ef_100%)] bg-clip-text text-[22px] font-extrabold tracking-[0.08em] text-transparent [writing-mode:vertical-rl] transition-all duration-700"
                      style={{ fontFamily: 'STKaiti, KaiTi, Kaiti SC, STFangsong, serif' }}
                    >
                      {scenario.tab}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 rounded-[18px] border border-slate-200/90 bg-white/75 px-3 py-3">
        <div className="flex items-center justify-end">
          <span className="text-xs font-medium text-slate-500">{scenarioIndex + 1}/{scenarios.length}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/90">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#6d4bff_0%,#8b5cf6_46%,#d946ef_100%)] transition-all duration-500 ease-out"
            style={{ width: `${((scenarioIndex + 1) / Math.max(scenarios.length, 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

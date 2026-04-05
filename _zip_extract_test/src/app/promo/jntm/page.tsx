"use client"
import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'

function HeaderBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-300 via-pink-300 to-rose-300 text-gray-900 rounded-xl p-6 md:p-8 shadow">
      <div className="flex items-center gap-3">
        <div className="text-4xl">🐔</div>
        <div>
          <div className="text-2xl md:text-3xl font-bold">你太美 · 积分回购推广</div>
          <div className="text-sm md:text-base">插件推广激励活动（非金融产品），拉新获“推积分”，支持转让或申请官方回购</div>
        </div>
      </div>
      <div className="mt-3 text-xs md:text-sm text-gray-700">1 积分 = 0.1 元插件消费额度，1🐔=1000 积分 = 100 元插件消费额度</div>
    </div>
  )
}

function RightsTable() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="border rounded-xl p-5 md:col-span-2">
        <div className="font-semibold mb-3">积分获取权益</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 whitespace-nowrap">
                <th className="py-2 pr-4 whitespace-nowrap">奖励类型</th>
                <th className="py-2 pr-4 whitespace-nowrap">触发条件</th>
                <th className="py-2 pr-4 whitespace-nowrap">奖励内容</th>
                <th className="py-2 whitespace-nowrap">到账规则</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t whitespace-nowrap">
                <td className="py-2 pr-4 whitespace-nowrap">即时奖励</td>
                <td className="py-2 pr-4 whitespace-nowrap">被推广者完成注册 + 首次使用插件</td>
                <td className="py-2 pr-4 whitespace-nowrap">80 积分（8 元）</td>
                <td className="py-2 whitespace-nowrap">即时到账</td>
              </tr>
              <tr className="border-t whitespace-nowrap">
                <td className="py-2 pr-4 whitespace-nowrap">阶梯奖励</td>
                <td className="py-2 pr-4 whitespace-nowrap">累计有效推广用户 10 人</td>
                <td className="py-2 pr-4 whitespace-nowrap">额外 200 积分（20 元）</td>
                <td className="py-2 whitespace-nowrap">按月结算</td>
              </tr>
              <tr className="border-t whitespace-nowrap">
                <td className="py-2 pr-4 whitespace-nowrap">阶梯奖励</td>
                <td className="py-2 pr-4 whitespace-nowrap">累计有效推广用户 50 人</td>
                <td className="py-2 pr-4 whitespace-nowrap">额外 2000 积分（200 元）</td>
                <td className="py-2 whitespace-nowrap">按月结算</td>
              </tr>
              <tr className="border-t whitespace-nowrap">
                <td className="py-2 pr-4 whitespace-nowrap">限时福利</td>
                <td className="py-2 pr-4 whitespace-nowrap">推广期转让积分</td>
                <td className="py-2 pr-4 whitespace-nowrap">转让折扣上限 97%</td>
                <td className="py-2 whitespace-nowrap">活动期自动生效</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="border rounded-xl p-3">
        <div className="font-semibold mb-3">积分变现权益</div>
        <ul className="text-sm space-y-2 break-words">
          <li className="break-words">积分转让：仅可转让给插件实名认证用户，折扣 90%-97%（推广期）/90%-95%（常规期），单月上限 8 万（推广期）/5 万（常规期）</li>
          <li className="break-words">官方回购：满足“发放满180天未使用/未转让 + 累计有效用户≥20 + 近90天无违规”，回购价=面额×50%，单月上限 2 万，年度上限 20 万</li>
        </ul>
      </div>
    </div>
  )
}

function ProcessFlow() {
  const steps = [
    { t: '资质认证', d: '注册推广账号，完成手机号/身份证/人脸核验' },
    { t: '获取推广工具', d: '生成专属推广链接 / 邀请码' },
    { t: '拉新推广', d: '分享链接/邀请码，引导用户注册插件' },
    { t: '积分到账', d: '满足有效用户判定后获取积分' },
    { t: '积分变现', d: '选择积分转让或官方回购' },
  ]
  return (
    <div className="border rounded-xl p-4">
      <div className="font-semibold mb-3">完整推广流程</div>
      <div className="grid md:grid-cols-5 gap-3">
        {steps.map((s, i) => (
          <div key={i} className="bg-white border rounded-lg p-3">
            <div className="text-sm font-medium">{i + 1}. {s.t}</div>
            <div className="text-xs text-gray-600 mt-1">{s.d}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-700">有效用户判定：完成实名认证 + 7 天内累计使用≥3 次 + 单次使用≥5 分钟 + 发生 1 次积分消费 + 未卸载插件</div>
    </div>
  )
}

function RuleItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-xl">
      <button className="w-full flex justify-between items-center p-4" onClick={() => setOpen(v => !v)}>
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs text-gray-600">{open ? '收起' : '展开'}</span>
      </button>
      {open && <div className="px-4 pb-4 text-sm text-gray-700">{children}</div>}
    </div>
  )
}

function RulesAccordion() {
  return (
    <div className="space-y-3">
      <RuleItem title="成本控制规则">
        <ul className="list-disc pl-5 space-y-1">
          <li>推广期让利上限：单用户累计让利≤单用户毛利 ×15%</li>
          <li>弹性预算：营收提取 10% 作为推广预算，超支 30% 调整规则</li>
          <li>积分有效期：180 天，到期未使用/未转让自动失效</li>
        </ul>
      </RuleItem>
      <RuleItem title="反作弊规则">
        <ul className="list-disc pl-5 space-y-1">
          <li>账号校验：设备 ID、IP、浏览器指纹关联检测</li>
          <li>异常阈值：1 天拉新≥20、人均同 IP 拉新≥10、有效留存＜30% 自动冻结积分发放</li>
          <li>处罚机制：轻度冻结 7 天，中度清零积分，重度永久封禁</li>
        </ul>
      </RuleItem>
      <RuleItem title="合规规则">
        <ul className="list-disc pl-5 space-y-1">
          <li>禁止“躺赚”“日入上千”等夸大宣传，不构成收益承诺</li>
          <li>流通限制：仅插件内转让，不可跨平台交易，不可兑换法币（官方回购除外）</li>
          <li>推广层级：仅一级推广奖励，无二级/团队计酬</li>
        </ul>
      </RuleItem>
    </div>
  )
}

function numberInput(v: string) {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

function useAuthToken() {
  const [token] = useState<string | null>(() => {
    try { return typeof window !== 'undefined' ? localStorage.getItem('token') : null } catch { return null }
  })
  return token
}

function FunctionsHub() {
  const token = useAuthToken()
  const [refSuffix, setRefSuffix] = useState('')
  const [referralCode, setReferralCode] = useState<string>('')
  const [refLink, setRefLink] = useState<string>('')
  const [qrUrl, setQrUrl] = useState<string>('')

  const [transferPoints, setTransferPoints] = useState('')
  const [transferDiscount, setTransferDiscount] = useState('95')
  const [transferMsg, setTransferMsg] = useState('')

  const [buybackPoints, setBuybackPoints] = useState('')
  const [buybackMsg, setBuybackMsg] = useState('')

  const genReferral = useCallback(async () => {
    try {
      if (!token) { setReferralCode(''); setRefLink(''); setQrUrl(''); return }
      const r = await fetch('/api/referral/generate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const j = await r.json()
      if (j?.success && j?.referralCode) {
        const code = refSuffix ? `${j.referralCode}-${refSuffix}` : j.referralCode
        setReferralCode(code)
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://jarvis.local'
        const link = `${origin}/register?ref=${encodeURIComponent(code)}`
        setRefLink(link)
        try {
          const data = await QRCode.toDataURL(link, { width: 240, margin: 1 })
          setQrUrl(data)
        } catch {
          setQrUrl('')
        }
      } else {
        setReferralCode('')
        setRefLink('')
        setQrUrl('')
      }
    } catch (e: any) {
      setReferralCode('')
      setRefLink('')
      setQrUrl('')
    }
  }, [token, refSuffix])

  const createTransfer = useCallback(async () => {
    try {
      if (!token) { setTransferMsg('请先登录'); return }
      const points = numberInput(transferPoints)
      const discount = numberInput(transferDiscount)
      const r = await fetch('/api/promo/transfer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ points, discount })
      })
      const j = await r.json()
      if (j?.success) setTransferMsg('发布成功')
      else setTransferMsg(j?.error || '发布失败')
    } catch (e: any) { setTransferMsg('网络错误') }
  }, [token, transferPoints, transferDiscount])

  const applyBuyback = useCallback(async () => {
    try {
      if (!token) { setBuybackMsg('请先登录'); return }
      const points = numberInput(buybackPoints)
      const r = await fetch('/api/promo/buyback/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ points })
      })
      const j = await r.json()
      if (j?.success) setBuybackMsg('申请已提交，结果将通知')
      else setBuybackMsg(j?.error || '申请失败')
    } catch (e: any) { setBuybackMsg('网络错误') }
  }, [token, buybackPoints])

  const doShare = useCallback(async () => {
    try {
      if (!refLink) return
      if ((navigator as any).share) {
        await (navigator as any).share({ title: '插件推广邀请', text: '邀请你加入并使用插件', url: refLink })
      }
    } catch {}
  }, [refLink])

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="border rounded-xl p-4">
        <div className="font-semibold mb-2">推广链接生成</div>
        <div className="space-y-2">
          <input className="w-full border rounded px-3 py-2 text-sm" placeholder="自定义后缀（可选）" value={refSuffix} onChange={e => setRefSuffix(e.target.value)} />
          <button className="w-full bg-gray-900 text-white rounded py-2 text-sm" onClick={genReferral}>生成链接</button>
          {referralCode && <div className="text-xs text-gray-700">推荐码：{referralCode}</div>}
          {refLink && (
            <div className="space-y-2">
              <Link href={refLink} className="text-blue-600 break-all text-xs" target="_blank">{refLink}</Link>
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white rounded py-1 text-xs" onClick={doShare}>系统分享</button>
                <button className="flex-1 bg-amber-500 text-white rounded py-1 text-xs" onClick={() => navigator.clipboard.writeText(refLink)}>复制链接</button>
              </div>
              {qrUrl && <img src={qrUrl} alt="qrcode" className="w-40 h-40" />}
            </div>
          )}
        </div>
      </div>
      <div className="border rounded-xl p-4">
        <div className="font-semibold mb-2">积分转让发布</div>
        <div className="space-y-2">
          <input className="w-full border rounded px-3 py-2 text-sm" placeholder="转让积分数量" value={transferPoints} onChange={e => setTransferPoints(e.target.value)} />
          <div className="flex items-center gap-2">
            <input className="flex-1 border rounded px-3 py-2 text-sm" placeholder="折扣（90-97）" value={transferDiscount} onChange={e => setTransferDiscount(e.target.value)} />
            <span className="text-xs text-gray-600">%</span>
          </div>
          <button className="w-full bg-gray-900 text-white rounded py-2 text-sm" onClick={createTransfer}>发布</button>
          {transferMsg && <div className="text-xs text-gray-700">{transferMsg}</div>}
        </div>
      </div>
      <div className="border rounded-xl p-4">
        <div className="font-semibold mb-2">官方回购申请</div>
        <div className="space-y-2">
          <input className="w-full border rounded px-3 py-2 text-sm" placeholder="申请回购积分数量" value={buybackPoints} onChange={e => setBuybackPoints(e.target.value)} />
          <button className="w-full bg-gray-900 text-white rounded py-2 text-sm" onClick={applyBuyback}>申请</button>
          {buybackMsg && <div className="text-xs text-gray-700">{buybackMsg}</div>}
        </div>
      </div>
    </div>
  )
}

function usePromoStats() {
  const token = useAuthToken()
  const [stats, setStats] = useState<any>(null)
  const [period, setPeriod] = useState<'day'|'week'|'month'>('day')
  const [suspendUntil, setSuspendUntil] = useState<number>(0)
  const [errCount, setErrCount] = useState(0)
  const load = useCallback(async () => {
    try {
      if (!token) { setStats(null); return }
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      if (!navigator.onLine) return
      if (suspendUntil && Date.now() < suspendUntil) return
      const ac = new AbortController()
      const to = setTimeout(() => ac.abort(), 2000)
      const r = await fetch(`/api/promo/stats?period=${period}`, { headers: { Authorization: `Bearer ${token}` }, signal: ac.signal })
      clearTimeout(to)
      if (!r.ok) { setErrCount(c => c + 1); return }
      const j = await r.json()
      if (j?.success) { setStats(j); setErrCount(0) }
    } catch {
      setErrCount(c => c + 1)
    } finally {
      if (errCount >= 3) { setSuspendUntil(Date.now() + 60_000); setErrCount(0) }
    }
  }, [token, period, suspendUntil, errCount])
  useEffect(() => { const id = setInterval(load, 5000); const init = setTimeout(load, 1000); return () => { clearInterval(id); clearTimeout(init) } }, [load])
  return { stats, period, setPeriod }
}

function Bars({ series }: { series: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...series.map(s => s.value))
  return (
    <div className="flex items-end gap-2 h-24">
      {series.map((s, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-6 bg-amber-400" style={{ height: `${(s.value / max) * 100}%` }} />
          <div className="text-[10px] text-gray-600 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function DataDashboard() {
  const { stats, period, setPeriod } = usePromoStats()
  const series = useMemo(() => (stats?.series || []).slice(0, 12), [stats])
  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">推广数据面板</div>
        <div className="flex gap-2">
          {(['day','week','month'] as const).map(p => (
            <button key={p} className={`px-2 py-1 rounded text-xs ${period===p?'bg-gray-900 text-white':'bg-gray-100'}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-4 gap-3 mt-4">
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-gray-600">累计推广用户</div>
          <div className="text-xl font-bold">{stats?.totals?.referred ?? '-'}</div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-gray-600">有效用户数</div>
          <div className="text-xl font-bold">{stats?.totals?.effective ?? '-'}</div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-gray-600">积分余额</div>
          <div className="text-xl font-bold">{stats?.totals?.points ?? '-'}</div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-gray-600">可转让/可回购</div>
          <div className="text-xl font-bold">{stats?.totals?.transferable ?? '-'}/{stats?.totals?.buybackable ?? '-'}</div>
        </div>
      </div>
      <div className="mt-4">
        <Bars series={series} />
      </div>
      {stats?.alerts?.length ? (
        <div className="mt-4 bg-rose-50 border border-rose-200 rounded p-3">
          <div className="text-sm font-medium text-rose-700">异常提醒</div>
          <ul className="list-disc pl-5 text-xs text-rose-700 mt-1">
            {stats.alerts.map((a: string, i: number) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function Records() {
  const token = useAuthToken()
  const [items, setItems] = useState<Array<any>>([])
  const load = useCallback(async () => {
    try {
      if (!token) { setItems([]); return }
      const r = await fetch('/api/promo/stats?records=1', { headers: { Authorization: `Bearer ${token}` } })
      const j = await r.json()
      if (j?.success) setItems(j.records || [])
    } catch {}
  }, [token])
  useEffect(() => { const id = setTimeout(load, 0); return () => clearTimeout(id) }, [load])
  return (
    <div className="border rounded-xl p-4">
      <div className="font-semibold">结算与记录</div>
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-4">类型</th>
              <th className="py-2 pr-4">积分</th>
              <th className="py-2 pr-4">折扣/价格</th>
              <th className="py-2 pr-4">状态</th>
              <th className="py-2">时间</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t">
                <td className="py-2 pr-4">{it.type}</td>
                <td className="py-2 pr-4">{it.points}</td>
                <td className="py-2 pr-4">{it.discount || it.price || '-'}</td>
                <td className="py-2 pr-4">{it.status || '-'}</td>
                <td className="py-2">{new Date(it.ts).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ComplianceFooter() {
  return (
    <div className="text-xs text-gray-600">
      <div>本页面仅涉及插件推广激励活动，不构成任何收益承诺或金融服务。</div>
      <div>禁止夸大宣传，推广奖励仅限插件内使用；仅支持一级推广，无团队计酬。</div>
    </div>
  )
}

export default function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6">
      <HeaderBanner />
      <RightsTable />
      <ProcessFlow />
      <RulesAccordion />
      <FunctionsHub />
      <DataDashboard />
      <Records />
      <ComplianceFooter />
    </div>
  )
}

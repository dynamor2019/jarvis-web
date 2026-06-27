"use client"
import { useEffect, useState } from "react"

export default function AdminStorePage() {
  const [counters, setCounters] = useState<{receipts:number;downloads:number;installs:number}>({receipts:0,downloads:0,installs:0})
  const [logs, setLogs] = useState<Array<{userId:string;pluginId:string;status:string;ts:number}>>([])
  const [aggPlugin, setAggPlugin] = useState<Array<{key:string;count:number}>>([])
  const [aggUser, setAggUser] = useState<Array<{key:string;count:number}>>([])
  const [userId, setUserId] = useState('')
  const [pluginId, setPluginId] = useState('')
  const [fromTs, setFromTs] = useState('')
  const [toTs, setToTs] = useState('')
  useEffect(()=>{
    const token = localStorage.getItem('token')
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    ;(async()=>{
      try {
        const a = await fetch('/api/admin/store/audit', { headers })
        const aj = await a.json()
        if (aj?.success) setCounters(aj.counters)
      } catch {}
      try {
        const l = await fetch('/api/admin/store/install-logs?limit=50', { headers })
        const lj = await l.json()
        if (lj?.success) setLogs(lj.logs||[])
      } catch {}
      try {
        const pa = await fetch('/api/admin/store/audit/aggregate?group_by=plugin', { headers })
        const pj = await pa.json()
        if (pj?.success) setAggPlugin(pj.results||[])
      } catch {}
      try {
        const ua = await fetch('/api/admin/store/audit/aggregate?group_by=user', { headers })
        const uj = await ua.json()
        if (uj?.success) setAggUser(uj.results||[])
      } catch {}
    })()
  },[])
  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">商店审计</h1>
      <FilterBar userId={userId} pluginId={pluginId} fromTs={fromTs} toTs={toTs} onChange={{setUserId,setPluginId,setFromTs,setToTs}} onApply={async()=>{
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }
        const qs = new URLSearchParams()
        if (userId) qs.set('userId', userId)
        if (pluginId) qs.set('pluginId', pluginId)
        if (fromTs) qs.set('from_ts', String(new Date(fromTs).getTime()))
        if (toTs) qs.set('to_ts', String(new Date(toTs).getTime()))
        const l = await fetch('/api/admin/store/install-logs?'+qs.toString(), { headers })
        const lj = await l.json(); if (lj?.success) setLogs(lj.logs||[])
        const pa = await fetch('/api/admin/store/audit/aggregate?group_by=plugin&'+qs.toString(), { headers })
        const pj = await pa.json(); if (pj?.success) setAggPlugin(pj.results||[])
        const ua = await fetch('/api/admin/store/audit/aggregate?group_by=user&'+qs.toString(), { headers })
        const uj = await ua.json(); if (uj?.success) setAggUser(uj.results||[])
      }}/>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <StatCard title="收据" value={counters.receipts} color="indigo"/>
        <StatCard title="下载" value={counters.downloads} color="purple"/>
        <StatCard title="安装" value={counters.installs} color="green"/>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <AggCard title="按插件安装次数" items={aggPlugin}/>
        <AggCard title="按用户安装次数" items={aggUser}/>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">安装日志</h2>
        <div className="space-y-2">
          {logs.map((l,i)=> (
            <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex gap-3">
                <span className="px-2 py-1 rounded bg-gray-200">{l.status}</span>
                <span>{l.pluginId}</span>
              </div>
              <div className="text-sm text-gray-600">{new Date(l.ts).toLocaleString()}</div>
            </div>
          ))}
          {logs.length===0 && <div className="text-gray-500">暂无数据</div>}
        </div>
      </div>
    </div>
  )
}

function StatCard({title,value,color}:{title:string;value:number;color:string}){
  const colorMap:any = { indigo:'text-indigo-600', purple:'text-purple-600', green:'text-green-600' }
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="text-gray-600 text-sm mb-2">{title}</div>
      <div className={`text-4xl font-bold ${colorMap[color]||'text-gray-900'}`}>{value}</div>
    </div>
  )
}

function AggCard({title,items}:{title:string;items:Array<{key:string;count:number}>}){
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <BarChart items={items}/>
    </div>
  )
}

function FilterBar({userId,pluginId,fromTs,toTs,onChange,onApply}:{userId:string;pluginId:string;fromTs:string;toTs:string;onChange:{setUserId:Function;setPluginId:Function;setFromTs:Function;setToTs:Function};onApply:Function}){
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6 grid md:grid-cols-5 gap-4">
      <input value={userId} onChange={e=>onChange.setUserId(e.target.value)} placeholder="用户ID" className="border rounded px-3 py-2"/>
      <input value={pluginId} onChange={e=>onChange.setPluginId(e.target.value)} placeholder="插件ID" className="border rounded px-3 py-2"/>
      <input type="date" value={fromTs} onChange={e=>onChange.setFromTs(e.target.value)} className="border rounded px-3 py-2"/>
      <input type="date" value={toTs} onChange={e=>onChange.setToTs(e.target.value)} className="border rounded px-3 py-2"/>
      <button onClick={()=>onApply()} className="bg-blue-600 text-white rounded px-4">筛选</button>
    </div>
  )
}

function BarChart({items}:{items:Array<{key:string;count:number}>}){
  const max = Math.max(1, ...items.map(i=>i.count))
  return (
    <div className="space-y-2">
      {items.map((it,i)=> (
        <div key={i} className="flex items-center gap-3">
          <div className="w-40 truncate" title={it.key}>{it.key}</div>
          <div className="flex-1 bg-gray-100 rounded h-3">
            <div className="bg-blue-600 h-3 rounded" style={{ width: `${(it.count/max)*100}%` }}></div>
          </div>
          <div className="w-12 text-right">{it.count}</div>
        </div>
      ))}
      {items.length===0 && <div className="text-gray-500">暂无数据</div>}
    </div>
  )
}

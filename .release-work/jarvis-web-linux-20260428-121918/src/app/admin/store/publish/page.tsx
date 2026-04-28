"use client"
import { useState } from "react"

export default function AdminPublishPage(){
  const [pluginId,setPluginId]=useState('')
  const [name,setName]=useState('')
  const [version,setVersion]=useState('1.0.0')
  const [price,setPrice]=useState('0')
  const [file,setFile]=useState<File|null>(null)
  const [msg,setMsg]=useState('')
  const [preview,setPreview]=useState<any>(null)
  const submit=async()=>{
    try{
      if(!pluginId||!file){ setMsg('请填写插件ID并选择文件'); return }
      const buf = await file.arrayBuffer()
      const b64 = Buffer.from(buf).toString('base64')
      const token = localStorage.getItem('token')
      const r = await fetch('/api/admin/store/publish',{method:'POST',headers:{'Content-Type':'application/json','Authorization':token?`Bearer ${token}`:''},body:JSON.stringify({plugin_id:pluginId,name,version,price:Number(price),pkg_base64:b64})})
      const j = await r.json()
      if(j?.success){ setMsg('发布成功'); }
      else setMsg('发布失败：'+(j?.error||'unknown'))
    }catch(e:any){ setMsg('错误：'+e.message) }
  }
  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">发布插件</h1>
      <div className="space-y-4">
        <input value={pluginId} onChange={e=>setPluginId(e.target.value)} placeholder="插件ID" className="border rounded px-3 py-2 w-full"/>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="名称（可选）" className="border rounded px-3 py-2 w-full"/>
        <div className="grid grid-cols-2 gap-4">
          <input value={version} onChange={e=>setVersion(e.target.value)} placeholder="版本" className="border rounded px-3 py-2"/>
          <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="价格" className="border rounded px-3 py-2"/>
        </div>
        <input type="file" onChange={async e=>{
          const f=e.target.files?.[0]||null
          setFile(f)
          try{
            if(!f){ setPreview(null); return }
            const buf=await f.arrayBuffer()
            const obj=JSON.parse(Buffer.from(buf).toString('utf8'))
            setPreview({
              id: obj?.manifest?.id,
              name: obj?.manifest?.name,
              version: obj?.manifest?.version,
              permissions: Array.isArray(obj?.manifest?.permissions)?obj.manifest.permissions:[],
              menusCount: Array.isArray(obj?.manifest?.menus)?obj.manifest.menus.length:0,
              publisher_key_id: obj?.publisher_key_id,
              dev_algo: obj?.dev_algo
            })
          }catch{ setPreview(null) }
        }} className="border rounded px-3 py-2 w-full"/>
        {preview && (
          <div className="border rounded px-3 py-2 text-sm">
            <div>Manifest: {preview.id} / {preview.name} / v{preview.version}</div>
            <div>权限: {preview.permissions.join(', ')||'-'}</div>
            <div>菜单数量: {preview.menusCount}</div>
            <div>开发者签名: {preview.dev_algo||'-'} ({preview.publisher_key_id||'-'})</div>
          </div>
        )}
        <button onClick={submit} className="bg-blue-600 text-white rounded px-4 py-2">发布</button>
        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
      </div>
    </div>
  )
}

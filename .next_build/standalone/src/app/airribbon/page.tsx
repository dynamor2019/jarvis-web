"use client"
import React, { useEffect, useRef, useState } from 'react'
import '@icon-park/react/styles/index.css'
import Icon, { ALL_ICON_KEYS, IconType } from '@icon-park/react/es/all'
import Image from 'next/image'
import { useIntl, FormattedMessage } from 'react-intl'

type HostMessage = {
  type: string
  [k: string]: any
}

function postToHost(msg: HostMessage) {
  try {
    const s = JSON.stringify(msg)
    // WebView2
    // @ts-ignore
    if (window.chrome?.webview?.postMessage) {
      // @ts-ignore
      window.chrome.webview.postMessage(s)
      return
    }
    // fallback
    window.parent?.postMessage(msg, '*')
  } catch {}
}

export default function AirRibbonPage() {
  const intl = useIntl()
  const [blocked, setBlocked] = useState<{ offline: boolean; unsubscribed: boolean }>({ offline: false, unsubscribed: false })
  const [hydrated, setHydrated] = useState(false)
  const formulaAutoSendRef = useRef<string | null>(null)
  useEffect(() => {
    try {
      setTimeout(() => setHydrated(true), 0)
      const offline = typeof navigator !== 'undefined' ? !navigator.onLine : false
      const token = (() => { try { return localStorage.getItem('token') || '' } catch { return '' } })()
      setTimeout(() => setBlocked({ offline, unsubscribed: !token }), 0)
      function onNet() {
        try {
          const off = typeof navigator !== 'undefined' ? !navigator.onLine : false
          setBlocked(prev => ({ ...prev, offline: off }))
        } catch {}
      }
      window.addEventListener('online', onNet)
      window.addEventListener('offline', onNet)
      ;(async () => {
        if (!token) {
          try { postToHost({ type: 'LOGIN_SYNC', status: 'unauthorized' }) } catch {}
          return
        }
        try {
          const r = await fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
          if (!r.ok) { 
            setBlocked(prev => ({ ...prev, unsubscribed: true }))
            try { postToHost({ type: 'LOGIN_SYNC', status: 'error' }) } catch {}
            return 
          }
          const j = await r.json().catch(() => ({} as any))
          const lt = (j?.user?.licenseType || '').toLowerCase()
          const end = j?.user?.subscriptionEnd ? new Date(j.user.subscriptionEnd).getTime() : 0
          const now = Date.now()
          const isFree = lt === 'free' || lt === 'trial' || !lt
          const expired = !!end && end < now
          setBlocked(prev => ({ ...prev, unsubscribed: isFree || expired }))
          try { 
            postToHost({ 
              type: 'LOGIN_SYNC', 
              status: 'success', 
              token, 
              user: j.user 
            }) 
          } catch {}
        } catch {
          setBlocked(prev => ({ ...prev, unsubscribed: true }))
          try { postToHost({ type: 'LOGIN_SYNC', status: 'error' }) } catch {}
        }
      })()
      return () => {
        window.removeEventListener('online', onNet)
        window.removeEventListener('offline', onNet)
      }
    } catch {}
  }, [])
  function normalizeChunk(s: string): string {
    try {
      return String(s || '').replace(/(.)\1{2,}/g, '$1').replace(/\s{2,}/g, ' ');
    } catch {
      return s;
    }
  }
  const [env, setEnv] = useState<{ username?: string; locale?: string }>({})
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const genTimer = useRef<any>(null)
  const typingTimer = useRef<any>(null)
  const typingBuffer = useRef<string>('')
  const typingSpeed = useRef<number>(18)
  const lastChunkRef = useRef<string>('')
  const [allowed, setAllowed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useState<string>(() => {
    try { return localStorage.getItem('api_key') || '' } catch { return '' }
  })
  const [company, setCompany] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('custom_model_config')
      if (saved) {
        const cfg = JSON.parse(saved)
        return cfg?.provider || 'doubao'
      }
      return localStorage.getItem('local_provider') || 'doubao'
    } catch { return 'doubao' }
  })
  const [model, setModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('custom_model_config')
      if (saved) {
        const cfg = JSON.parse(saved)
        return cfg?.model || ''
      }
      return localStorage.getItem('local_model') || ''
    } catch { return '' }
  })
  const [proEnabled, setProEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('pro_api_enabled') === '1' } catch { return false }
  })
  const apiKeyRef = useRef<string>(apiKey)
  useEffect(() => { apiKeyRef.current = apiKey }, [apiKey])
  const [cards, setCards] = useState<Array<{ id: string; text: string; sent?: boolean; sections?: Array<{ tab: string; items: Array<{ title: string; text: string; type?: string }> }> }>>([])
  const [draftId, setDraftId] = useState<string | null>(null)
  const draftIdRef = useRef<string | null>(null)
  useEffect(() => { draftIdRef.current = draftId }, [draftId])
  const [screenshots, setScreenshots] = useState<Array<{ base64: string; name?: string; path?: string; mime?: string }>>([])
  const nextIdRef = useRef<number>(1)
  const imageRef = useRef<HTMLInputElement>(null)
  const lastInstructionRef = useRef<string>('')
  const lastImagesRef = useRef<Array<{ base64: string; mime?: string }>>([])
  const liteFallbackTriedRef = useRef<boolean>(false)
  const structuredModeRef = useRef<boolean>(false)
  const [cardTabs, setCardTabs] = useState<Record<string, number>>({})

  const isWV = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('wv') === '1'

  const sendInstruction = React.useCallback((instruction: string, pics: Array<{ base64: string; mime?: string }>) => {
    try {
      if (pics && pics.length > 0) {
        if (!proEnabled) {
          setProEnabled(true)
          try {
            postToHost({
              type: 'saveApiKey',
              masked: apiKey ? (apiKey.slice(0, 4) + '…' + apiKey.slice(-4)) : '',
              apiKeyRaw: isWV ? apiKey : undefined,
              provider: company
            })
          } catch {}
        } else {
          try {
            postToHost({
              type: 'saveApiKey',
              masked: apiKey ? (apiKey.slice(0, 4) + '…' + apiKey.slice(-4)) : '',
              apiKeyRaw: isWV ? apiKey : undefined,
              provider: company
            })
          } catch {}
        }
      }
    } catch {}
    const id = String(nextIdRef.current++)
    setCards(prev => [...prev, { id, text: '', sent: false }])
    setDraftId(id)
    setGenerating(true)
    try { if (genTimer.current) { clearTimeout(genTimer.current); genTimer.current = null } } catch {}
    try { genTimer.current = setTimeout(() => { setGenerating(false) }, 60000) } catch {}
    const images = (pics || []).map(s => ({ base64: s.base64, mime: s.mime }))
    try { lastInstructionRef.current = instruction } catch {}
    try { lastImagesRef.current = pics || [] } catch {}
    postToHost({ type: 'generate', instruction: instruction, images, provider: company, model })
  }, [apiKey, isWV, proEnabled, company, model])

  function normalizeLatexInText(s: string): string {
    let t = String(s || '')
    t = t.replace(/\\\[/g, '')
    t = t.replace(/\\\]/g, '')
    t = t.replace(/\\\(/g, '')
    t = t.replace(/\\\)/g, '')
    t = t.replace(/\\left/g, '')
    t = t.replace(/\\right/g, '')
    t = t.replace(/\\begin\{[^}]+\}/g, '')
    t = t.replace(/\\end\{[^}]+\}/g, '')
    t = t.replace(/\\\\/g, '\n')
    t = t.replace(/&=/g, '=')
    t = t.replace(/&/g, '')
    return t
  }
  function mdToHtml(md: string): string {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const lines = normalizeLatexInText(md).split(/\r?\n/)
    const out: string[] = []
    let inUl = false
    let inOl = false
    const flushLists = () => {
      if (inUl) { out.push('</ul>'); inUl = false }
      if (inOl) { out.push('</ol>'); inOl = false }
    }
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i]
      if (/^\s*#\s*/.test(ln)) { flushLists(); out.push('<h1>' + esc(ln.replace(/^\s*#\s*/, '')) + '</h1>'); continue }
      if (/^\s*##\s*/.test(ln)) { flushLists(); out.push('<h2>' + esc(ln.replace(/^\s*##\s*/, '')) + '</h2>'); continue }
      if (/^\s*###\s*/.test(ln)) { flushLists(); out.push('<h3>' + esc(ln.replace(/^\s*###\s*/, '')) + '</h3>'); continue }
      if (/^\s*[-*]\s+/.test(ln)) {
        if (!inUl) { flushLists(); out.push('<ul>'); inUl = true }
        const txt = ln.replace(/^\s*[-*]\s+/, '')
        out.push('<li>' + esc(txt).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') + '</li>')
        continue
      }
      if (/^\s*\d+\.\s+/.test(ln)) {
        if (!inOl) { flushLists(); out.push('<ol>'); inOl = true }
        const txt = ln.replace(/^\s*\d+\.\s+/, '')
        out.push('<li>' + esc(txt).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>') + '</li>')
        continue
      }
      if (!ln.trim()) { flushLists(); continue }
      flushLists()
      const p = esc(ln).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
      out.push('<p>' + p + '</p>')
    }
    flushLists()
    return out.join('')
  }
  function buildSections(md: string): Array<{ tab: string; items: Array<{ title: string; text: string }> }> {
    const lines = String(md || '').split(/\r?\n/)
    const tabs: Array<{ tab: string; content: string[] }> = []
    let currentTab = { tab: intl.formatMessage({ id: 'airribbon.tab.output', defaultMessage: 'Output' }), content: [] as string[] }
    for (const ln of lines) {
      if (/^#\s*/.test(ln)) {
        if (currentTab.content.length) tabs.push(currentTab)
        currentTab = { tab: ln.replace(/^#\s*/, '').trim() || intl.formatMessage({ id: 'airribbon.tab.output', defaultMessage: 'Output' }), content: [] }
      } else {
        currentTab.content.push(ln)
      }
    }
    if (currentTab.content.length || tabs.length === 0) tabs.push(currentTab)
    const res: Array<{ tab: string; items: Array<{ title: string; text: string }> }> = []
    for (const t of tabs) {
      const segs: Array<{ title: string; text: string }> = []
      let cur: { title: string; buf: string[] } | null = null
      for (const ln of t.content) {
        if (/^##\s*/.test(ln)) {
          if (cur && cur.buf.length) segs.push({ title: cur.title, text: cur.buf.join('\n').trim() })
          cur = { title: ln.replace(/^##\s*/, '').trim() || intl.formatMessage({ id: 'airribbon.card.untitled', defaultMessage: 'Untitled' }), buf: [] }
        } else {
          if (!cur) cur = { title: intl.formatMessage({ id: 'airribbon.card.content', defaultMessage: 'Content' }), buf: [] }
          cur.buf.push(ln)
        }
      }
      if (cur && cur.buf.length) segs.push({ title: cur.title, text: cur.buf.join('\n').trim() })
      res.push({ tab: t.tab, items: segs.length ? segs : [{ title: intl.formatMessage({ id: 'airribbon.card.content', defaultMessage: 'Content' }), text: t.content.join('\n').trim() }] })
    }
    return res
  }
  function shouldStructure(md: string): boolean {
    const text = String(md || '')
    const h2Matches = text.match(/^##\s*/mg) || []
    const h1Matches = text.match(/^#\s*/mg) || []
    return h2Matches.length >= 1 || h1Matches.length >= 1
  }
  function extractJsonPayload(s: string): string | null {
    const t = String(s || '').trim()
    if (!t) return null
    if (t.startsWith('{') && t.endsWith('}')) return t
    const m1 = t.match(/```json([\s\S]*?)```/i)
    if (m1 && m1[1]) return m1[1].trim()
    const m2 = t.match(/```([\s\S]*?)```/)
    if (m2 && m2[1]) {
      const inner = m2[1].trim()
      if (inner.startsWith('{') && inner.endsWith('}')) return inner
    }
    const first = t.indexOf('{')
    const last = t.lastIndexOf('}')
    if (first >= 0 && last > first) return t.substring(first, last + 1)
    return null
  }
  function mapJsonToSections(jsonText: string): Array<{ tab: string; items: Array<{ title: string; text: string; type?: string }> }> | null {
    try {
      const data = JSON.parse(jsonText)
      const cards = Array.isArray(data?.cards) ? data.cards : []
      if (!cards || cards.length === 0) return null
      const items = cards.map((c: any) => {
        const title = String((c?.title || '')).trim()
        const subtitle = String((c?.subtitle || '')).trim()
        const contentArr = Array.isArray(c?.content) ? c.content : []
        const bullets = contentArr.map((x: any) => '- ' + String(x || '')).join('\n')
        const type = String((c?.type || '')).trim()
        const header = title || intl.formatMessage({ id: 'airribbon.card.default_title', defaultMessage: 'Card' })
        const body = [subtitle ? `**${subtitle}**` : '', bullets].filter(Boolean).join('\n')
        return { title: header, text: body, type }
      })
      return [{ tab: intl.formatMessage({ id: 'airribbon.card.default_title', defaultMessage: 'Card' }), items }]
    } catch {
      return null
    }
  }
  function styleForType(type?: string): React.CSSProperties {
    const t = String(type || '').toLowerCase()
    if (t === 'problem') return { borderLeft: '4px solid #ff4444', background: '#fff5f5' }
    if (t === 'solution') return { borderLeft: '4px solid #00C851', background: '#f0fff4' }
    if (t === 'summary') return { borderLeft: '4px solid #FFBB33', background: '#fff8e1' }
    if (t === 'suggestion') return { borderLeft: '4px solid #33b5e5', background: '#f0f9ff' }
    return {}
  }
  function composeJsonCardPrompt(content: string): string {
    const base = intl.formatMessage({
      id: 'airribbon.prompt.json_card',
      defaultMessage: 'Please organize the text below into structured cards and strictly output JSON:\nFormat: {"cards":[{"type":"problem|solution|summary|suggestion","title":"string","subtitle":"string","content":["string"]}]}\nRequirements:\n1) Output ONLY JSON, no explanations, no code block markers\n2) \'content\' of each card must be an array of points; bolding allowed\n3) Fields are strings, \'type\' limited to the four categories\n\nText:'
    })
    return base + (content || '')
  }

  useEffect(() => {
    try {
      const main = document.querySelector('main') as HTMLElement | null
      const params = new URLSearchParams(window.location.search)
      const wv = params.get('wv') === '1'
      if (main) main.style.paddingTop = wv ? '0px' : '64px'
      if (wv && rootRef.current) rootRef.current.style.height = '100vh'
    } catch {}
    function onHostMessage(e: MessageEvent) {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.type === 'PLUGIN_ENV') {
          setEnv({ username: data.username, locale: data.locale })
          setAllowed(true)
        } else if (data?.type === 'screenshotBase64') {
          const b64 = data.base64 || ''
          const name = data.name || ''
          const path = data.path || ''
          if (b64) {
            setScreenshots(prev => [...prev, { base64: b64, name, path, mime: 'image/png' }])
            try {
              const pending = formulaAutoSendRef.current
              if (pending) {
                formulaAutoSendRef.current = null
                sendInstruction(pending, [{ base64: b64, mime: 'image/png' }])
              }
            } catch {}
          }
        } else if (data?.type === 'genChunk') {
          const raw = data.chunk || ''
          const chunk = normalizeChunk(raw)
          if (chunk && lastChunkRef.current && chunk.trim() === lastChunkRef.current.trim()) {
            return
          }
          if (chunk) {
            lastChunkRef.current = chunk
            typingBuffer.current += chunk
            if (!typingTimer.current) {
              try {
                typingTimer.current = setInterval(() => {
                  const currentDraftId = draftIdRef.current
                  if (!currentDraftId) return
                  if (!typingBuffer.current || typingBuffer.current.length === 0) return
                  const nextChar = typingBuffer.current[0]
                  typingBuffer.current = typingBuffer.current.slice(1)
                  setCards(prev => prev.map(c => {
                    if (c.id !== currentDraftId) return c
                    const prevText = c.text || ''
                    const newText = normalizeChunk(prevText + nextChar)
                    return { ...c, text: newText }
                  }))
                }, typingSpeed.current)
              } catch {}
            }
          }
        } else if (data?.type === 'genComplete') {
          setGenerating(false)
          try { if (genTimer.current) { clearTimeout(genTimer.current); genTimer.current = null } } catch {}
          try {
            const currentDraftId = draftIdRef.current
            if (currentDraftId) {
              const rest = normalizeChunk(typingBuffer.current)
              setCards(prev => prev.map(c => {
                if (c.id !== currentDraftId) return c
                const txt = normalizeChunk((c.text || '') + (rest || ''))
                const jsonText = extractJsonPayload(txt)
                const jsonSecs = jsonText ? mapJsonToSections(jsonText) : null
                if (jsonSecs) {
                  return { ...c, text: '', sections: jsonSecs }
                }
                if (structuredModeRef.current || shouldStructure(txt)) {
                  const secs = buildSections(txt)
                  return { ...c, text: '', sections: secs }
                }
                return { ...c, text: txt }
              }))
            }
            typingBuffer.current = ''
            try { if (typingTimer.current) { clearInterval(typingTimer.current); typingTimer.current = null } } catch {}
            setDraftId(null)
            lastChunkRef.current = ''
            structuredModeRef.current = false
          } catch {}
        } else if (data?.type === 'genError') {
          setGenerating(false)
          try { if (genTimer.current) { clearTimeout(genTimer.current); genTimer.current = null } } catch {}
          const err = data.error || intl.formatMessage({ id: 'airribbon.error.generation', defaultMessage: 'Generation failed' })
          try {
            const t = String(err || '')
            const shouldFallback = t.includes('SetLimitExceeded') || t.includes('TooMany') || t.includes('429') || t.includes('paused')
            if (shouldFallback && !liteFallbackTriedRef.current) {
              liteFallbackTriedRef.current = true
                try {
                postToHost({ type: 'saveApiKey', masked: apiKeyRef.current ? (apiKeyRef.current.slice(0, 4) + '…' + apiKeyRef.current.slice(-4)) : '', apiKeyRaw: ((typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('wv') === '1') ? apiKeyRef.current : undefined), provider: 'doubao-lite' })
              } catch {}
              try {
                const imgs = (lastImagesRef.current || []).map(s => ({ base64: s.base64, mime: s.mime }))
                postToHost({ type: 'generate', instruction: lastInstructionRef.current || '', images: imgs })
              } catch {}
            } else {
              alert(err)
              try { setBlocked(prev => ({ ...prev, offline: true })) } catch {}
            }
          } catch { alert(err) }
          const currentDraftId = draftIdRef.current
          setCards(prev => prev.filter(c => !(c.id === currentDraftId && (!c.text || !c.text.trim()))))
          setDraftId(null)
          try { if (typingTimer.current) { clearInterval(typingTimer.current); typingTimer.current = null } } catch {}
          typingBuffer.current = ''
        } else if (data?.type === 'PLUGIN_ENV_SAVED') {
          setSettingsOpen(false)
        }
      } catch {}
    }
    const onWebViewMessage = (ev: any) => {
      try {
        const s = ev?.data
        const data = typeof s === 'string' ? JSON.parse(s) : s
        onHostMessage({ data } as any)
      } catch {}
    }

    // Prevent duplicate listeners in WebView2
    // If we are in WebView2, we prefer the native event listener
    // If we are in a browser/iframe, we use the standard message event
    const isWebView2 = typeof window !== 'undefined' && !!(window as any).chrome?.webview

    if (!isWebView2) {
      window.addEventListener('message', onHostMessage)
    }
    try {
      // @ts-ignore
      if (window.chrome?.webview?.addEventListener) {
        // @ts-ignore
        window.chrome.webview.addEventListener('message', onWebViewMessage)
      }
    } catch {}
    // 初次加载告知宿主已就绪
    postToHost({ type: 'AIRRIBBON_READY', version: '1.0.0' })
    return () => {
      window.removeEventListener('message', onHostMessage)
      try {
        // @ts-ignore
        if (window.chrome?.webview?.removeEventListener) {
          // @ts-ignore
          window.chrome.webview.removeEventListener('message', onWebViewMessage)
        }
      } catch {}
    }
  }, [sendInstruction])

  async function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].some(t => f.type.includes(t)) && !['.pdf', '.docx', '.txt'].some(ext => f.name.endsWith(ext))) {
      alert(intl.formatMessage({ id: 'airribbon.upload.error', defaultMessage: 'Only .docx / .pdf / .txt are supported' }))
      return
    }
    setUploading(true)
    setProgress(10)
    const buf = await f.arrayBuffer()
    setProgress(60)
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
    postToHost({ type: 'uploadFileBase64', name: f.name, mime: f.type || 'application/octet-stream', base64 })
    setProgress(100)
    setTimeout(() => { setUploading(false); setProgress(0) }, 800)
  }

  function onScreenshot() {
    postToHost({ type: 'screenshot' })
  }

  function setInputValue(t: string) {
    const el = inputRef.current
    if (el) el.value = t
  }

  function onSend() {
    const text = inputRef.current?.value?.trim() || ''
    if (!text && screenshots.length === 0) return
    sendInstruction(text, screenshots)
  }

  function onSendToBody(cardId: string, text: string) {
    if (!text) return
    const jsonText = extractJsonPayload(text)
    let html = ''
    if (jsonText) {
      const secs = mapJsonToSections(jsonText)
      if (secs && secs.length > 0) {
        const active = 0
        const sec = secs[active]
        const parts = (sec.items || []).map(it => `<div><div><strong>${it.title}</strong></div>${mdToHtml(it.text || '')}</div>`).join('')
        html = `<html><head><meta charset="utf-8"></head><body>${parts}</body></html>`
      } else {
        html = mdToHtml(text)
      }
    } else {
      html = mdToHtml(text)
    }
    postToHost({ type: 'insertHtml', html })
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, sent: true } : c))
  }

  function onOpenSettings() {
    setSettingsOpen(true)
  }

  function onSaveSettings() {
    try {
      localStorage.setItem('api_key', apiKey)
      localStorage.setItem('pro_api_enabled', proEnabled ? '1' : '0')
      localStorage.setItem('local_provider', company)
      localStorage.setItem('local_model', model)
      postToHost({ type: 'saveApiKey', masked: apiKey ? apiKey.slice(0, 4) + '…' + apiKey.slice(-4) : '', apiKeyRaw: isWV ? apiKey : undefined, provider: company })
      setSettingsOpen(false)
    } catch {
      setSettingsOpen(false)
    }
  }

  const toolbar = [
    { id: 'langfix', label: intl.formatMessage({ id: 'airribbon.toolbar.langfix', defaultMessage: 'Lang Fix' }), iconType: 'EditTwo' as IconType, prompt: '' },
    { id: 'scholar', label: intl.formatMessage({ id: 'airribbon.toolbar.scholar', defaultMessage: 'Scholar' }), iconType: 'Search' as IconType, prompt: intl.formatMessage({ id: 'airribbon.prompt.scholar', defaultMessage: 'Please search for relevant academic literature and provide abstract highlights and citation suggestions.' }) },
    { id: 'translate', label: intl.formatMessage({ id: 'airribbon.toolbar.translate', defaultMessage: 'Translate' }), iconType: 'Translate' as IconType, prompt: intl.formatMessage({ id: 'airribbon.prompt.translate', defaultMessage: 'Please translate the following content into academic English style with accurate terminology.' }) },
    { id: 'templates', label: intl.formatMessage({ id: 'airribbon.toolbar.templates', defaultMessage: 'Templates' }), iconType: 'DocDetail' as IconType, prompt: intl.formatMessage({ id: 'airribbon.prompt.templates', defaultMessage: 'Please provide structured writing templates and example paragraphs for this topic.' }) },
    { id: 'submit', label: intl.formatMessage({ id: 'airribbon.toolbar.submit', defaultMessage: 'Submit Check' }), iconType: 'CheckOne' as IconType, prompt: intl.formatMessage({ id: 'airribbon.prompt.submit', defaultMessage: 'Please check if it meets submission requirements and list items needing modification.' }) },
    { id: 'pdf', label: intl.formatMessage({ id: 'airribbon.toolbar.pdf', defaultMessage: 'Read PDF' }), iconType: 'FilePdf' as IconType, prompt: intl.formatMessage({ id: 'airribbon.prompt.pdf', defaultMessage: 'Please summarize and extract key points from the uploaded PDF content.' }) },
    { id: 'formula', label: intl.formatMessage({ id: 'airribbon.toolbar.formula', defaultMessage: 'Formula' }), iconType: 'Sum' as IconType, prompt: intl.formatMessage({ id: 'airribbon.prompt.formula', defaultMessage: 'Extract only mathematical formulas from the image and convert them to pure LaTeX code (excluding formula environment markers like $$ or \\[\\]). Accurately restore formula symbols, exponents, fractions, etc. Do not output any extra explanation, descriptive text, or irrelevant content.' }) },
  ]
  function safeIcon(type: IconType): IconType {
    try { return (ALL_ICON_KEYS as ReadonlyArray<string>).includes(type) ? type : 'Application' as IconType } catch { return 'Application' as IconType }
  }

  if (hydrated && blocked.offline && !apiKey) {
    const reason = blocked.offline
      ? intl.formatMessage({ id: 'airribbon.offline.network_error', defaultMessage: 'Network unavailable, cannot connect to server' })
      : intl.formatMessage({ id: 'airribbon.offline.not_pro', defaultMessage: 'Current account is not subscribed to JarvisAI PRO' })
    const btn = (
      <a href="/store" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(90deg, #6C8EFF, #9D7AFF)', color: '#FFFFFF', textDecoration: 'none' }}>
        <FormattedMessage id="airribbon.btn.pro_portal" defaultMessage="PRO Portal" />
      </a>
    )
    return (
      <div style={{ width: '100%', height: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: 'Segoe UI, Microsoft YaHei, system-ui' }}>
        <div style={{ width: 560, maxWidth: '92%', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.08)', padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, background: 'linear-gradient(90deg,#6C8EFF,#9D7AFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>JarvisAI PRO</div>
          <div style={{ marginTop: 10, color: '#4B5563' }}>{reason}</div>
          <div style={{ marginTop: 6, color: '#6B7280' }}><FormattedMessage id="airribbon.desc.subscribe" defaultMessage="Subscribe to JarvisAI PRO to unlock advanced generation and image understanding" /></div>
          <div style={{ marginTop: 16 }}>{btn}</div>
        </div>
      </div>
    )
  }
  return (
    <div
      ref={rootRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{ width: '100%', height: 'calc(100vh - 64px)', position: 'relative', overflow: 'hidden', fontFamily: 'Segoe UI, Microsoft YaHei, system-ui', background: '#F9FAFB' }}
    >
      <style>{`
        @keyframes jarvisNeonPulse {
          0% { opacity: .35; filter: blur(8px); }
          50% { opacity: .85; filter: blur(12px); }
          100% { opacity: .35; filter: blur(8px); }
        }
        @keyframes jarvisNeonShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes jarvisRainbowShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes jarvisSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .jarvis-neon { position: relative; }
        .jarvis-neon::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 12px;
          background: linear-gradient(90deg, #6C8EFF, #9D7AFF, #6C8EFF);
          background-size: 200% 200%;
          animation: jarvisNeonShift 3s linear infinite, jarvisNeonPulse 1.8s ease-in-out infinite;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
      <div style={{ position: 'absolute', left: 0, right: 80, top: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', padding: 12 }}>
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, color: '#111827', minHeight: 120 }}>
            {uploading && <div style={{ marginBottom: 10, height: 6, background: '#E5E7EB', borderRadius: 6 }}><div style={{ width: `${progress}%`, height: 6, background: '#6366F1', borderRadius: 6 }} /></div>}
            {cards.map(card => (
              <div key={card.id} style={{ position: 'relative', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <button
                  onClick={() => setCards(prev => prev.filter(c => c.id !== card.id))}
                  title={intl.formatMessage({ id: 'airribbon.btn.delete', defaultMessage: 'Delete' })}
                  style={{ position: 'absolute', right: 8, top: 8, width: 22, height: 22, borderRadius: 6, border: 'none', background: '#FFFFFF', color: '#6B7280', cursor: 'pointer', fontSize: 14, lineHeight: '22px' }}
                >×</button>
                {!card.sections && (() => {
                  const jt = extractJsonPayload(card.text || '')
                  const alt = jt ? mapJsonToSections(jt) : null
                  if (alt) {
                    const active = (cardTabs[card.id] ?? 0)
                    const sec = alt[active] || { tab: '', items: [] }
                    return (
                      <div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                          {alt.map((s, idx) => (
                            <button
                              key={s.tab + idx}
                              onClick={() => setCardTabs(prev => ({ ...prev, [card.id]: idx }))}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                border: '1px solid #E5E7EB',
                                background: (cardTabs[card.id] ?? 0) === idx ? '#EEF2FF' : '#FFFFFF',
                                color: (cardTabs[card.id] ?? 0) === idx ? '#4F46E5' : '#374151',
                                cursor: 'pointer'
                              }}
                            >
                              {s.tab || `Tab ${idx + 1}`}
                            </button>
                          ))}
                        </div>
                        <div>
                          {(sec.items || []).map((it, i) => (
                            <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: 10, marginBottom: 10, ...styleForType(it.type) }}>
                              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                {it.title}
                                {it.type ? <span style={{ fontSize: 11, marginLeft: 8, color: '#6B7280' }}>{String(it.type).toLowerCase()}</span> : null}
                              </div>
                              <div
                                style={{ whiteSpace: 'normal' }}
                                dangerouslySetInnerHTML={{ __html: mdToHtml(it.text || '') }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                                <button
                                  onClick={() => onSendToBody(card.id + ':' + i, it.text || '')}
                                  title={intl.formatMessage({ id: 'airribbon.btn.send_to_body', defaultMessage: 'Send to Body' })}
                                  style={{ fontSize: 12, color: '#374151', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                >
                                  <FormattedMessage id="airribbon.btn.send_to_body" defaultMessage="Send to Body" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div
                      style={{ whiteSpace: 'normal' }}
                      dangerouslySetInnerHTML={{ __html: card.text ? mdToHtml(card.text) : (draftId === card.id ? intl.formatMessage({ id: 'airribbon.status.generating', defaultMessage: 'Generating…' }) : '') }}
                    />
                  )
                })()}
                {card.sections && (
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      {(card.sections || []).map((sec, idx) => (
                        <button
                          key={sec.tab + idx}
                          onClick={() => setCardTabs(prev => ({ ...prev, [card.id]: idx }))}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid #E5E7EB',
                            background: (cardTabs[card.id] ?? 0) === idx ? '#EEF2FF' : '#FFFFFF',
                            color: (cardTabs[card.id] ?? 0) === idx ? '#4F46E5' : '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          {sec.tab || `Tab ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                    {(() => {
                      const active = (cardTabs[card.id] ?? 0)
                      const sec = (card.sections || [])[active] || { tab: '', items: [] }
                      return (
                        <div>
                          {(sec.items || []).map((it, i) => (
                            <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: 10, marginBottom: 10, ...styleForType(it.type) }}>
                              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                                {it.title}
                                {it.type ? <span style={{ fontSize: 11, marginLeft: 8, color: '#6B7280' }}>{String(it.type).toLowerCase()}</span> : null}
                              </div>
                              <div
                                style={{ whiteSpace: 'normal' }}
                                dangerouslySetInnerHTML={{ __html: mdToHtml(it.text) }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                                <button
                                  onClick={() => onSendToBody(card.id + ':' + i, it.text)}
                                  title={intl.formatMessage({ id: 'airribbon.btn.send_to_body', defaultMessage: 'Send to Body' })}
                                  style={{ fontSize: 12, color: '#374151', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                >
                                  <FormattedMessage id="airribbon.btn.send_to_body" defaultMessage="Send to Body" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={() => onSendToBody(card.id, card.text)}
                    title={card.sent ? intl.formatMessage({ id: 'airribbon.btn.sent', defaultMessage: 'Sent' }) : intl.formatMessage({ id: 'airribbon.btn.send_to_body', defaultMessage: 'Send to Body' })}
                    disabled={!card.text || !!card.sent}
                    style={{ fontSize: 12, color: card.sent ? '#6B7280' : '#374151', border: 'none', background: 'transparent', cursor: (!card.text || card.sent) ? 'not-allowed' : 'pointer', opacity: (!card.text || card.sent) ? 0.7 : 1 }}
                  >
                    {card.sent ? <FormattedMessage id="airribbon.btn.sent" defaultMessage="Sent" /> : <FormattedMessage id="airribbon.btn.send_to_body" defaultMessage="Send to Body" />}
                  </button>
                </div>
              </div>
            ))}
            {cards.length === 0 && generating && <div style={{ whiteSpace: 'pre-wrap' }}><FormattedMessage id="airribbon.status.generating" defaultMessage="Generating…" /></div>}
          </div>
        </div>
        <div style={{ padding: 12, background: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 16, background: '#FFFFFF', border: '1px solid #E5E7EB', padding: 10 }}>
            {screenshots.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {screenshots.map((img, idx) => (
                  <div key={idx} style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 6, background: '#FAFAFA' }}>
                    <Image src={`data:image/png;base64,${img.base64}`} alt={img.name || `screenshot-${idx + 1}`} width={180} height={120} style={{ borderRadius: 6 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <div style={{ fontSize: 11, color: '#6B7280', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name || intl.formatMessage({ id: 'airribbon.label.screenshot', defaultMessage: 'Screenshot {index}' }, { index: idx + 1 })}</div>
                      <button
                        onClick={() => setScreenshots(prev => prev.filter((_, i) => i !== idx))}
                        style={{ fontSize: 12, color: '#374151', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      ><FormattedMessage id="airribbon.btn.delete" defaultMessage="Delete" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{
              borderRadius: 12,
              padding: generating ? 2 : 0,
              backgroundColor: 'transparent',
              backgroundImage: generating ? 'linear-gradient(90deg, #FF6B6B, #FCA311, #FFD43B, #2BD4C7, #6C8EFF, #9D7AFF, #FF6BDF, #FF6B6B)' : 'none',
              backgroundSize: '300% 300%',
              backgroundPosition: '0% 50%',
              animation: generating ? 'jarvisRainbowShift 4s linear infinite' : 'none'
            }}>
              <div style={{ borderRadius: 10, background: '#FFFFFF' }}>
                <textarea ref={inputRef} placeholder={intl.formatMessage({ id: 'airribbon.input.placeholder', defaultMessage: 'Send message or type / to select skill' })} style={{ width: '100%', minHeight: 56, padding: 12, borderRadius: 10, border: '1px solid #E5E7EB', position: 'relative', zIndex: 1, background: '#FFFFFF' }} />
              </div>
            </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <button onClick={() => fileRef.current?.click()} title={intl.formatMessage({ id: 'airribbon.btn.upload', defaultMessage: 'Upload Attachment' })} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon type={safeIcon('Attachment' as IconType)} theme="outline" size={18} fill="#374151" />
            </button>
            <button onClick={onScreenshot} title={intl.formatMessage({ id: 'airribbon.btn.screenshot', defaultMessage: 'Screenshot' })} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon type={safeIcon('Screenshot' as IconType)} theme="outline" size={18} fill="#374151" />
            </button>
            <button
              disabled={generating}
              onClick={onSend}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                border: 'none',
                background: generating ? '#E5E5EA' : 'linear-gradient(90deg, #6C8EFF, #9D7AFF)',
                color: '#FFFFFF',
                cursor: generating ? 'not-allowed' : 'pointer',
                transform: 'scale(1.0)',
                transition: 'transform .1s',
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => { if (!generating) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.0)' }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)' }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.0)' }}
              title={intl.formatMessage({ id: 'airribbon.btn.send', defaultMessage: 'Send' })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ display: 'block' }}>
                <path d="M2,21 L23,12 L2,3 L2,10 L17,12 L2,14 Z" fill="#F4D03F" />
              </svg>
            </button>
            </div>
            <input ref={fileRef} type="file" accept=".docx,.pdf,.txt,image/*" style={{ display: 'none' }} onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return
              if (f.type && f.type.startsWith('image/')) {
                try {
                  const reader = new FileReader()
                  reader.onload = () => {
                    try {
                      const dataUrl = String(reader.result || '')
                      const idx = dataUrl.indexOf('base64,')
                      const base64 = idx >= 0 ? dataUrl.substring(idx + 7) : dataUrl
                      const mime = f.type || 'image/png'
                      setScreenshots(prev => [...prev, { base64, name: f.name, mime }])
                    } catch {}
                  }
                  reader.readAsDataURL(f)
                } catch {}
                try { e.target.value = '' } catch {}
                return
              }
              const dragEvent = { preventDefault() {}, dataTransfer: { files: [f] } } as unknown as React.DragEvent
              await onDrop(dragEvent)
              try { e.target.value = '' } catch {}
            }} />
            <input ref={imageRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (!files.length) return
              for (const f of files) {
                try {
                  const reader = new FileReader()
                  reader.onload = () => {
                    try {
                      const dataUrl = String(reader.result || '')
                      const idx = dataUrl.indexOf('base64,')
                      const base64 = idx >= 0 ? dataUrl.substring(idx + 7) : dataUrl
                      const mime = f.type || 'image/png'
                      setScreenshots(prev => [...prev, { base64, name: f.name, mime }])
                    } catch {}
                  }
                  reader.readAsDataURL(f)
                } catch {}
              }
              try { e.target.value = '' } catch {}
            }} />
          </div>
        </div>
        {settingsOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: 420, background: '#FFFFFF', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}><FormattedMessage id="airribbon.settings.title" defaultMessage="Settings" /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 13, color: '#374151' }}><FormattedMessage id="airribbon.settings.apikey" defaultMessage="API Key" /></label>
                <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={intl.formatMessage({ id: 'airribbon.settings.apikey_placeholder', defaultMessage: 'Enter your API Key' })} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                <label style={{ fontSize: 13, color: '#374151' }}><FormattedMessage id="airribbon.settings.company" defaultMessage="Company" /></label>
                <select value={company} onChange={e => setCompany(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <option value="doubao">{intl.formatMessage({ id: 'airribbon.settings.provider.doubao', defaultMessage: 'Doubao (ByteDance)' })}</option>
                  <option value="siliconflow">SiliconFlow</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
                <label style={{ fontSize: 13, color: '#374151' }}><FormattedMessage id="airribbon.settings.model" defaultMessage="Model" /></label>
                <input value={model} onChange={e => setModel(e.target.value)} placeholder={intl.formatMessage({ id: 'airribbon.settings.model_placeholder', defaultMessage: 'e.g. deepseek-chat / gpt-4o / Qwen/Qwen2.5-7B-Instruct' })} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                <label style={{ fontSize: 13, color: '#374151' }}><FormattedMessage id="airribbon.settings.advanced_api" defaultMessage="Advanced API (Toggle)" /></label>
                <div style={{ width: 140, height: 36, borderRadius: 18, background: proEnabled ? '#4F46E5' : '#E5E7EB', position: 'relative', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ 
                    width: 68, height: 32, borderRadius: 16, background: '#FFFFFF', 
                    position: 'absolute', top: 2, 
                    left: proEnabled ? 70 : 2, 
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: 12, color: proEnabled ? '#4F46E5' : '#6B7280'
                  }}>
                    {proEnabled ? 'PRO' : 'LITE'}
                  </div>
                  <div onClick={() => setProEnabled(false)} style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 10 }} />
                  <div onClick={() => setProEnabled(true)} style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 10 }} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => setSettingsOpen(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer' }}><FormattedMessage id="airribbon.btn.cancel" defaultMessage="Cancel" /></button>
                  <button onClick={onSaveSettings} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#4F46E5', color: '#FFFFFF', cursor: 'pointer' }}><FormattedMessage id="airribbon.btn.save" defaultMessage="Save" /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: '#0F2A6D', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 6px', overflow: 'hidden' }}>
        {toolbar.map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'langfix') {
                structuredModeRef.current = true
                const userText = inputRef.current?.value?.trim() || ''
                const prompt = composeJsonCardPrompt(userText)
                sendInstruction(prompt, [])
              } else if (item.id === 'formula') {
                const pics = (screenshots || []).map(s => ({ base64: s.base64, mime: s.mime }))
                if (pics.length > 0) {
                  sendInstruction(item.prompt, pics)
                } else {
                  formulaAutoSendRef.current = item.prompt
                  onScreenshot()
                }
              } else {
                setInputValue(item.prompt)
              }
            }}
            className="w-full flex flex-col items-center gap-2 px-2 py-2 text-white/90 hover:text-white transition-colors"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm ring-1 ring-white/20">
              <Icon type={safeIcon(item.iconType)} theme="outline" size={20} fill="#F4D03F" />
            </div>
            <div className="text-[11px] text-center leading-[14px]">{item.label}</div>
          </button>
        ))}
        <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8 }}>
          <button onClick={onOpenSettings} title={intl.formatMessage({ id: 'airribbon.toolbar.settings', defaultMessage: 'Settings' })} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#102B7A', color: '#FFFFFF', cursor: 'pointer' }}>
            <Icon type={safeIcon('SettingTwo' as IconType)} theme="outline" size={20} fill="#FFFFFF" />
          </button>
          <button title={intl.formatMessage({ id: 'airribbon.toolbar.help', defaultMessage: 'Help' })} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#102B7A', color: '#FFFFFF', cursor: 'pointer' }}>
            <Icon type={safeIcon('Help' as IconType)} theme="outline" size={20} fill="#FFFFFF" />
          </button>
          <button title={intl.formatMessage({ id: 'airribbon.toolbar.account', defaultMessage: 'Account' })} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#102B7A', color: '#FFFFFF', cursor: 'pointer' }}>
            <Icon type={safeIcon('User' as IconType)} theme="outline" size={20} fill="#FFFFFF" />
          </button>
        </div>
      </div>
    </div>
  )
}

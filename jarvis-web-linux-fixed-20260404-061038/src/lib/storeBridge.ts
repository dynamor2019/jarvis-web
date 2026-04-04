export type StoreMessageType =
  | 'STORE_READY'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'REQUEST_INSTALL'
  | 'REQUEST_UNINSTALL'
  | 'REQUEST_UPDATE'
  | 'REQUEST_ROLLBACK'
  | 'PLUGIN_ENV'
  | 'REQUEST_PURCHASE'
  | 'INSTALL_RESULT'

export interface StoreMessage<T = any> {
  type: StoreMessageType
  request_id?: string
  payload?: T
}

export function sendMessage<T>(win: Window, type: StoreMessageType, payload?: T, requestId?: string) {
  const msg: StoreMessage<T> = { type, payload, request_id: requestId }
  win.postMessage(msg, '*')
}

export function onMessage(handler: (msg: StoreMessage, ev: MessageEvent) => void) {
  const listener = (ev: MessageEvent) => {
    const data = ev.data
    if (!data || typeof data !== 'object') return
    if (!('type' in data)) return
    const normalized = data as any
    if (normalized.payload === undefined && normalized.data !== undefined) {
      normalized.payload = normalized.data
    }
    handler(normalized as StoreMessage, ev)
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}

export function genRequestId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const Bridge = {
  ready(features: string[]) {
    sendMessage(window, 'STORE_READY', { store_version: '1.0.0', features }, genRequestId())
  },
  requestPurchase(pluginId: string, channel: 'wechat' | 'alipay' | 'mock') {
    if ((window as any).jarvisBridge?.sendMessage) {
      ;(window as any).jarvisBridge.sendMessage('REQUEST_PURCHASE', { plugin_id: pluginId, channel })
    }
    sendMessage(window, 'REQUEST_PURCHASE', { plugin_id: pluginId, channel }, genRequestId())
  },
  paymentSuccess(
    paymentId: string,
    pluginId: string,
    downloadToken: string,
    expiresAt: number,
    details?: Record<string, any>
  ) {
    const payload = {
      orderNo: paymentId,
      productName: pluginId,
      amount: 0,
      ...(details || {}),
    }
    if ((window as any).jarvisBridge?.onPaymentSuccess) {
      ;(window as any).jarvisBridge.onPaymentSuccess(payload)
    }
    sendMessage(
      window,
      'PAYMENT_SUCCESS',
      { payment_id: paymentId, plugin_id: pluginId, download_token: downloadToken, expires_at: expiresAt, ...(details || {}) },
      genRequestId()
    )
  },
  paymentFailed(paymentId: string, pluginId: string, reason: string) {
    if ((window as any).jarvisBridge?.sendMessage) {
      ;(window as any).jarvisBridge.sendMessage('PAYMENT_FAILED', { payment_id: paymentId, plugin_id: pluginId, reason })
    }
    sendMessage(window, 'PAYMENT_FAILED', { payment_id: paymentId, plugin_id: pluginId, reason }, genRequestId())
  },
  requestInstall(pluginId: string, downloadToken: string, version?: string) {
    if ((window as any).jarvisBridge?.sendMessage) {
      ;(window as any).jarvisBridge.sendMessage('request_install', { plugin_id: pluginId, download_token: downloadToken, version })
    }
    sendMessage(window, 'REQUEST_INSTALL', { plugin_id: pluginId, download_token: downloadToken, version }, genRequestId())
  },
  requestUninstall(pluginId: string) {
    if ((window as any).jarvisBridge?.sendMessage) {
      ;(window as any).jarvisBridge.sendMessage('request_uninstall', { plugin_id: pluginId })
    }
    sendMessage(window, 'REQUEST_UNINSTALL', { plugin_id: pluginId }, genRequestId())
  },
  requestUpdate(pluginId: string, fromVersion: string, toVersion: string, downloadToken: string) {
    const payload = { plugin_id: pluginId, from_version: fromVersion, to_version: toVersion, download_token: downloadToken }
    if ((window as any).jarvisBridge?.sendMessage) {
      ;(window as any).jarvisBridge.sendMessage('request_update', payload)
    }
    sendMessage(window, 'REQUEST_UPDATE', payload, genRequestId())
  },
  requestRollback(pluginId: string, fromVersion: string, toVersion: string, downloadToken: string) {
    const payload = { plugin_id: pluginId, from_version: fromVersion, to_version: toVersion, download_token: downloadToken }
    if ((window as any).jarvisBridge?.sendMessage) {
      ;(window as any).jarvisBridge.sendMessage('request_rollback', payload)
    }
    sendMessage(window, 'REQUEST_ROLLBACK', payload, genRequestId())
  },
}

"use client"
import React from 'react'
import { IconProvider, DEFAULT_ICON_CONFIGS } from '@icon-park/react'

export default function IconProviderClient({ children }: { children: React.ReactNode }) {
  const iconConfig = { ...DEFAULT_ICON_CONFIGS, prefix: 'icon', theme: 'outline', size: 20, strokeWidth: 3 } as any
  return <IconProvider value={iconConfig}>{children}</IconProvider>
}

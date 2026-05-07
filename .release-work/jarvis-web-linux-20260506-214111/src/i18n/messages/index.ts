import zhCN from './zh-CN.json';
import enUS from './en-US.json';
import frFR from './fr-FR.json';
import deDE from './de-DE.json';
import esES from './es-ES.json';

export const messagesMap: Record<string, Record<string, string>> = {
  'zh-CN': zhCN as unknown as Record<string, string>,
  'en-US': enUS as unknown as Record<string, string>,
  'fr-FR': frFR as unknown as Record<string, string>,
  'de-DE': deDE as unknown as Record<string, string>,
  'es-ES': esES as unknown as Record<string, string>,
};

export function getMessages(locale: string) {
  return messagesMap[locale] ?? messagesMap['zh-CN'];
}

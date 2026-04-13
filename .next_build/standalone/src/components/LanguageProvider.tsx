"use client";
import { IntlProvider } from "react-intl";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getMessages } from "@/i18n/messages";

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>("zh-CN");

  useEffect(() => {
    const fromNavigator = () => {
      const navLang = navigator.language;
      if (navLang.startsWith('zh')) return 'zh-CN';
      if (navLang.startsWith('en')) return 'en-US';
      if (navLang.startsWith('fr')) return 'fr-FR';
      if (navLang.startsWith('de')) return 'de-DE';
      if (navLang.startsWith('es')) return 'es-ES';
      return 'zh-CN';
    };

    const resolveLocale = async () => {
      if (typeof window === "undefined") return;
      let v = localStorage.getItem("preferredLanguage");
      
      if (!v) {
        try {
          const response = await fetch('/api/locale', { cache: 'no-store' });
          const payload = await response.json();
          if (response.ok && payload?.success && payload?.locale) {
            v = String(payload.locale);
          }
        } catch {}
      }

      if (!v) {
        v = fromNavigator();
      }

      if (typeof document !== "undefined") {
        document.documentElement.lang = v;
      }
      setLocale(v);
    };

    resolveLocale();
    const handler = () => { resolveLocale(); };
    const storageHandler = (event: StorageEvent) => {
      if (!event.key || event.key === "preferredLanguage") {
        resolveLocale();
      }
    };

    window.addEventListener("jarvis-languagechange", handler);
    window.addEventListener("storage", storageHandler);
    window.addEventListener("focus", handler);
    window.addEventListener("pageshow", handler);

    return () => {
      window.removeEventListener("jarvis-languagechange", handler);
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("focus", handler);
      window.removeEventListener("pageshow", handler);
    };
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);

  return <IntlProvider locale={locale} messages={messages}>{children}</IntlProvider>;
}

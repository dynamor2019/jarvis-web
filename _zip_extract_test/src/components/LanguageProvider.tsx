"use client";
import { IntlProvider } from "react-intl";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getMessages } from "@/i18n/messages";

export default function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>("zh-CN");

  useEffect(() => {
    const resolveLocale = () => {
      if (typeof window === "undefined") return;
      let v = localStorage.getItem("preferredLanguage");
      
      if (!v) {
        const navLang = navigator.language;
        if (navLang.startsWith('zh')) v = 'zh-CN';
        else if (navLang.startsWith('en')) v = 'en-US';
        else if (navLang.startsWith('fr')) v = 'fr-FR';
        else if (navLang.startsWith('de')) v = 'de-DE';
        else if (navLang.startsWith('es')) v = 'es-ES';
        else v = 'zh-CN';
      }

      if (typeof document !== "undefined") {
        document.documentElement.lang = v;
      }
      setLocale(v);
    };

    resolveLocale();
    const handler = () => resolveLocale();
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

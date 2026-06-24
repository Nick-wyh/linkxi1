import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Lang, translations } from "@/lib/i18n";

const LANG_KEY = "lingxi:lang";

function detectLang(): Lang {
  if (typeof window === "undefined") return "zh";
  // Check localStorage first
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "en" || stored === "zh") return stored;
  // Detect from browser
  const navLang = navigator.language || "";
  if (navLang.startsWith("zh")) return "zh";
  // Default to Chinese for now (you can change this)
  return "zh";
}

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof translations.zh;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

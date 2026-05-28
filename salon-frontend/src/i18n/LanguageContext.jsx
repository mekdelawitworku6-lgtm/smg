import { createContext, useContext, useState, useCallback } from "react";
import translations from "./translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("appLang") || "en";
  });

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "am" : "en";
      localStorage.setItem("appLang", next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      let text = translations[lang]?.[key];
      if (text === undefined) {
        text = translations.en[key] || key;
      }
      if (params && Object.keys(params).length > 0) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, v);
        }
      }
      return text;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}

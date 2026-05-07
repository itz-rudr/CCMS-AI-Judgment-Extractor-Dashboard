"use client";

import { useSettings } from "../contexts/SettingsContext";
import en from "../../locales/en.json";
import hi from "../../locales/hi.json";
import kn from "../../locales/kn.json";

const dictionaries: Record<string, any> = { en, hi, kn };

export function useTranslation() {
  const { settings } = useSettings();
  const lang = settings.preferences?.language || "en";

  const t = (key: string): string => {
    const keys = key.split(".");
    let value = dictionaries[lang];
    
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    
    // Fallback to English
    if (value === undefined && lang !== "en") {
      let fallbackValue = dictionaries["en"];
      for (const k of keys) {
        if (fallbackValue === undefined) break;
        fallbackValue = fallbackValue[k];
      }
      if (typeof fallbackValue === "string") return fallbackValue;
    }

    return typeof value === "string" ? value : key;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Invalid date, return as is
      
      const localeMap: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        kn: "kn-IN"
      };
      
      return new Intl.DateTimeFormat(localeMap[lang], {
        year: "numeric",
        month: "short",
        day: "numeric"
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return { t, formatDate, lang };
}

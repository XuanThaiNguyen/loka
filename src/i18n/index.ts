import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import * as Localization from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { resources, type SupportedLanguage } from "./resources";

export const DEFAULT_LANGUAGE: SupportedLanguage = "vi";
export const supportedLanguages = Object.keys(resources) as SupportedLanguage[];

export function getDeviceLanguage(): SupportedLanguage {
  const languageCode = Localization.getLocales()[0]?.languageCode;
  return supportedLanguages.includes(languageCode as SupportedLanguage)
    ? (languageCode as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

const i18n = createInstance();

const initialized = i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: supportedLanguages,
  interpolation: {
    escapeValue: false,
  },
});

const STORAGE_KEY = "loka.language";
export const languageReady = initialized.then(async () => {
  try {
    const saved = Platform.OS === "web" ? (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null) : await SecureStore.getItemAsync(STORAGE_KEY);
    if (saved === "en" || saved === "vi") await i18n.changeLanguage(saved);
  } catch { /* Storage may be unavailable; keep the working in-memory locale. */ }
  i18n.on("languageChanged", (language) => {
    if (language !== "vi" && language !== "en") return;
    if (Platform.OS === "web") {
      try { localStorage.setItem(STORAGE_KEY, language); } catch { /* Private storage can be unavailable. */ }
    } else void SecureStore.setItemAsync(STORAGE_KEY, language).catch(() => {});
  });
});

export { i18n };
export type { SupportedLanguage };

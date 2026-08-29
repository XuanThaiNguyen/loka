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

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: supportedLanguages,
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
export type { SupportedLanguage };

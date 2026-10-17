import { I18nextProvider } from "react-i18next";
import { useEffect, useState, type PropsWithChildren } from "react";
import { ActivityIndicator, View } from "react-native";

import { i18n, languageReady } from "./index";

export function I18nProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  useEffect(() => { let mounted = true; void languageReady.then(() => { if (mounted) setReady(true); }); return () => { mounted = false; }; }, []);
  if (!ready) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator /></View>;
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

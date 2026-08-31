import { QueryClientProvider } from "@tanstack/react-query";
import { HeroUINativeProvider } from "heroui-native/provider";
import type { HeroUINativeConfig } from "heroui-native/provider";
import type { PropsWithChildren } from "react";
import { I18nManager } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { I18nProvider } from "@/i18n/i18n-provider";
import { queryClient } from "@/lib/query/query-client";
import { AppThemeProvider } from "@/theme/theme-provider";

const heroUIConfig: HeroUINativeConfig = {
  textProps: {
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.5,
    adjustsFontSizeToFit: false,
  },
  textInputProps: {
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.5,
  },
  devInfo: {
    stylingPrinciples: false,
  },
  isRTL: I18nManager.isRTL,
};

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <AppThemeProvider>
          <HeroUINativeProvider config={heroUIConfig}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </HeroUINativeProvider>
        </AppThemeProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "expo-router";
import { HeroUINativeProvider } from "heroui-native/provider";
import type { HeroUINativeConfig } from "heroui-native/provider";
import type { PropsWithChildren } from "react";
import { I18nManager } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { queryClient } from "@/lib/query/query-client";
import { navigationTheme } from "@/theme/navigation-theme";

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
      <HeroUINativeProvider config={heroUIConfig}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
        </QueryClientProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}

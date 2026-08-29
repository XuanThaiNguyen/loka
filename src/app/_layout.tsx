import "react-native-gesture-handler";
import "@/global.css";
import "@/i18n";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/providers/app-providers";
import { theme } from "@/theme/theme";

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.light.background },
        }}
      />
      <StatusBar style="auto" />
    </AppProviders>
  );
}

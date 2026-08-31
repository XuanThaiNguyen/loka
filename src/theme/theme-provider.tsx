import { ThemeProvider as NavigationThemeProvider } from "expo-router";
import type { PropsWithChildren } from "react";

import { navigationTheme } from "./navigation-theme";

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

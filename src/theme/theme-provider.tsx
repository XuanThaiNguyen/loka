import { ThemeProvider as NavigationThemeProvider } from "expo-router";
import { useEffect, type PropsWithChildren } from "react";
import { Uniwind } from "uniwind";

import { navigationTheme } from "./navigation-theme";

export function AppThemeProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    // Screens and navigation currently use the light palette explicitly.
    // Keep HeroUI controls in the same mode until screens support dark mode.
    Uniwind.setTheme("light");
  }, []);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

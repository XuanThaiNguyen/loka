import { DefaultTheme, type Theme } from "expo-router";

import { theme } from "./theme";

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.light.accent,
    background: theme.colors.light.background,
    card: theme.colors.light.surface,
    text: theme.colors.light.foreground,
    border: theme.colors.light.border,
    notification: theme.colors.light.danger,
  },
};

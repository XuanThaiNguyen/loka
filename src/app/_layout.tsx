import "react-native-gesture-handler";
import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/features/auth/auth-provider";
import { AppProviders } from "@/providers/app-providers";
import { theme } from "@/theme/theme";

function RootNavigator() {
  const { isPending, session } = useAuth();

  if (isPending) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.light.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.light.background },
        }}
      >
        <Stack.Protected guard={Boolean(session)}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="city/[id]" />
          <Stack.Screen name="collection/[slug]" />
          <Stack.Screen name="destination/[id]" />
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.background,
  },
});

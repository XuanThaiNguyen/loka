import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/features/auth/auth-provider";
import { authClient } from "@/lib/auth/auth-client";
import { theme } from "@/theme/theme";

export function SignInScreen() {
  const { t } = useTranslation();
  const { refreshSession } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (result.error) {
        setError(result.error.message ?? t("auth.errors.signIn"));
        return;
      }

      await refreshSession();
      router.replace("/");
    } catch {
      setError(t("auth.errors.network"));
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              contentFit="cover"
            />
          </View>
          <Text style={styles.brandName}>Loka</Text>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>{t("auth.title")}</Text>
          <Text style={styles.description}>{t("auth.description")}</Text>
        </View>

        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("auth.google")}
            disabled={isSigningIn}
            onPress={signInWithGoogle}
            style={({ pressed }) => [
              styles.googleButton,
              pressed && !isSigningIn ? styles.googleButtonPressed : null,
              isSigningIn ? styles.googleButtonDisabled : null,
            ]}
          >
            {isSigningIn ? (
              <ActivityIndicator color={theme.colors.light.base.white} />
            ) : (
              <Ionicons
                name="logo-google"
                size={21}
                color={theme.colors.light.base.white}
              />
            )}
            <Text style={styles.googleButtonLabel}>
              {isSigningIn ? t("auth.signingIn") : t("auth.google")}
            </Text>
          </Pressable>

          {error ? (
            <View accessibilityRole="alert" style={styles.errorMessage}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={theme.colors.light.error[600]}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.legal}>{t("auth.legal")}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: theme.colors.light.background,
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -130,
    right: -95,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: theme.colors.light.orange[100],
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -165,
    left: -125,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: theme.colors.light.blue[50],
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[8],
    justifyContent: "center",
    gap: theme.spacing[8],
  },
  brand: {
    alignItems: "center",
    gap: theme.spacing[3],
  },
  logoContainer: {
    width: 86,
    height: 86,
    padding: theme.spacing[2],
    borderRadius: theme.radius["2xl"],
    backgroundColor: theme.colors.light.base.white,
    shadowColor: theme.colors.light.gray[900],
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.xl,
  },
  brandName: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize["2xl"],
    lineHeight: theme.typography.lineHeight["2xl"],
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  copy: {
    alignItems: "center",
    gap: theme.spacing[3],
  },
  title: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize["3xl"],
    lineHeight: theme.typography.lineHeight["3xl"],
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    maxWidth: 340,
    color: theme.colors.light.gray[600],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    textAlign: "center",
  },
  card: {
    padding: theme.spacing[5],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.xl,
    gap: theme.spacing[4],
    backgroundColor: theme.colors.light.surface,
  },
  googleButton: {
    minHeight: 56,
    paddingHorizontal: theme.spacing[5],
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[3],
    backgroundColor: theme.colors.light.accent,
  },
  googleButtonPressed: {
    opacity: 0.86,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonLabel: {
    color: theme.colors.light.base.white,
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "800",
  },
  errorMessage: {
    padding: theme.spacing[3],
    borderRadius: theme.radius.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing[2],
    backgroundColor: theme.colors.light.error[50],
  },
  errorText: {
    flex: 1,
    color: theme.colors.light.error[700],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  legal: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    textAlign: "center",
  },
});

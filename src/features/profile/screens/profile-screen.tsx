import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/features/auth/auth-provider";
import { ProfileMenuItem } from "@/features/profile/components/profile-menu-item";
import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { i18n, type SupportedLanguage } from "@/i18n";
import { authClient } from "@/lib/auth/auth-client";
import { queryClient } from "@/lib/query/query-client";
import { theme } from "@/theme/theme";

const languages: SupportedLanguage[] = ["vi", "en"];

const deferredWebItems = [
  {
    key: "helpCenter",
    icon: "help-circle-outline",
    webUrl: null,
  },
  {
    key: "terms",
    icon: "information-circle-outline",
    webUrl: null,
  },
  {
    key: "privacy",
    icon: "lock-closed-outline",
    webUrl: null,
  },
] as const;

export function ProfileScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const bottomPadding = useTabBottomPadding();
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = session?.user;
  const displayName = user?.name?.trim() || t("profile.fallbackName");

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
      queryClient.clear();
    } catch {
      Alert.alert(t("profile.signOutErrorTitle"), t("profile.signOutError"));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <View style={styles.screen}>
      <TravelScreenHeader title={t("profile.title")} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
      >
        <View style={styles.identity}>
          <View style={styles.avatarContainer}>
            {user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {displayName.charAt(0).toLocaleUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={theme.colors.light.accentForeground}
              />
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
        </View>

        <View style={styles.contactCard}>
          <View style={styles.contactIcon}>
            <Ionicons
              name="person-outline"
              size={22}
              color={theme.colors.light.gray[800]}
            />
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.phone}>{t("profile.googleAccount")}</Text>
          </View>
          <Pressable
            accessibilityLabel={t("profile.editProfile")}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.editButton}
          >
            <Ionicons
              name="pencil-outline"
              size={22}
              color={theme.colors.light.gray[500]}
            />
          </Pressable>
        </View>

        <View style={styles.menu}>
          <ProfileMenuItem
            icon="receipt-outline"
            title={t("profile.items.bookings.title")}
            subtitle={t("profile.items.bookings.subtitle")}
            onPress={() => router.push("/trips")}
          />
          <ProfileMenuItem
            icon="card-outline"
            title={t("profile.items.payment.title")}
            subtitle={t("profile.items.payment.subtitle")}
          />
          <ProfileMenuItem
            icon="language-outline"
            title={t("profile.items.language.title")}
            subtitle={t(`profile.languages.${i18n.language}`)}
            onPress={() => setLanguageExpanded((current) => !current)}
          />

          {languageExpanded ? (
            <View style={styles.languageSelector}>
              {languages.map((language) => {
                const selected = i18n.language === language;
                return (
                  <Pressable
                    key={language}
                    onPress={() => i18n.changeLanguage(language)}
                    style={[
                      styles.languageButton,
                      selected ? styles.selectedLanguageButton : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageLabel,
                        selected ? styles.selectedLanguageLabel : null,
                      ]}
                    >
                      {t(`profile.languages.${language}`)}
                    </Text>
                    {selected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.light.accent}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {deferredWebItems.map((item) => (
            <ProfileMenuItem
              key={item.key}
              icon={item.icon}
              title={t(`profile.items.${item.key}.title`)}
              subtitle={t(`profile.items.${item.key}.subtitle`)}
            />
          ))}

          <ProfileMenuItem
            icon="star-outline"
            title={t("profile.items.rateUs.title")}
            subtitle={t("profile.items.rateUs.subtitle")}
          />
          <ProfileMenuItem
            icon="trash-outline"
            title={t("profile.items.deleteAccount.title")}
            subtitle={t("profile.items.deleteAccount.subtitle")}
            tone="danger"
          />
          <ProfileMenuItem
            icon="log-out-outline"
            title={
              isSigningOut
                ? t("profile.items.signOut.pending")
                : t("profile.items.signOut.title")
            }
            subtitle={t("profile.items.signOut.subtitle")}
            onPress={isSigningOut ? undefined : handleSignOut}
            tone="danger"
            isLast
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.light.background,
  },
  content: {
    paddingHorizontal: theme.spacing[5],
    gap: theme.spacing[5],
  },
  identity: {
    alignItems: "center",
    gap: theme.spacing[3],
  },
  avatarContainer: {
    width: 104,
    height: 104,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.gray[100],
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.orange[100],
  },
  avatarInitial: {
    color: theme.colors.light.accent,
    fontSize: theme.typography.fontSize["3xl"],
    lineHeight: theme.typography.lineHeight["3xl"],
    fontWeight: "900",
  },
  verifiedBadge: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderWidth: 3,
    borderColor: theme.colors.light.base.white,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.accent,
  },
  name: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "800",
  },
  contactCard: {
    minHeight: 88,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    backgroundColor: theme.colors.light.surface,
  },
  contactIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.gray[50],
  },
  contactDetails: {
    flex: 1,
    gap: theme.spacing[1],
  },
  email: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "600",
  },
  phone: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    paddingHorizontal: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.surface,
  },
  languageSelector: {
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.light.gray[100],
    flexDirection: "row",
    gap: theme.spacing[3],
  },
  languageButton: {
    flex: 1,
    height: 44,
    paddingHorizontal: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[2],
    backgroundColor: theme.colors.light.background,
  },
  selectedLanguageButton: {
    borderColor: theme.colors.light.accent,
    backgroundColor: theme.colors.light.orange[50],
  },
  languageLabel: {
    color: theme.colors.light.gray[600],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
  selectedLanguageLabel: {
    color: theme.colors.light.accent,
  },
});

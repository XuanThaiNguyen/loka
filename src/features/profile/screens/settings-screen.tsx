import { QueryFeedback } from "@/components/ui/loading-skeleton";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { useAuth } from "@/features/auth/auth-provider";
import { ProfileMenuItem } from "@/features/profile/components/profile-menu-item";
import {
  useCurrentAccount,
  useUpdateCurrentAccount,
} from "@/features/profile/services/profile-api-service";
import { JourneyHeader } from "@/components/ui/journey-header";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { i18n, type SupportedLanguage } from "@/i18n";
import { authClient } from "@/lib/auth/auth-client";
import { queryClient } from "@/lib/query/query-client";
import { theme, travelSurfaces } from "@/theme/theme";

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

export function SettingsScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const compactIdentity = width < 360;
  const { session } = useAuth();
  const accountQuery = useCurrentAccount();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom + 24;
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = accountQuery.data ?? session?.user;
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
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <JourneyHeader title={t("profileGallery.settings")} showBack />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
      >
        <QueryFeedback query={accountQuery} hasData={Boolean(user)} layout="card" />
        <View style={[styles.identity, compactIdentity && styles.compactIdentity]}>
          <View style={[styles.avatarContainer, compactIdentity && styles.compactAvatar]}>
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
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.phone}>{t("profile.googleAccount")}</Text>
          </View>
          <Pressable
            accessibilityLabel={t("profile.editProfile")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setProfileExpanded((current) => !current)}
            style={styles.editButton}
          >
            <Ionicons
              name="pencil-outline"
              size={22}
              color={theme.colors.light.gray[500]}
            />
          </Pressable>
        </View>

        {profileExpanded && user ? (
          <ProfileEditForm
            key={`${user.id}-${user.name}-${user.image}`}
            initialName={user.name ?? ""}
            initialImage={user.image ?? ""}
            onDone={() => setProfileExpanded(false)}
          />
        ) : null}

        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.groupTitle}>{t("settingsSections.preferences")}</Text>
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
            isLast={!languageExpanded}
            onPress={() => setLanguageExpanded((current) => !current)}
          />

          {languageExpanded ? (
            <View style={styles.languageSelector}>
              {languages.map((language) => {
                const selected = i18n.language === language;
                return (
                  <Pressable
                    key={language}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
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
                        color={theme.colors.light.accentForeground}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

        </View>
        </View>
        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.groupTitle}>{t("settingsSections.support")}</Text>
        <View style={styles.menu}>
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
            isLast
            title={t("profile.items.rateUs.title")}
            subtitle={t("profile.items.rateUs.subtitle")}
          />
        </View>
        </View>
        <View style={styles.group}>
          <Text accessibilityRole="header" style={styles.groupTitle}>{t("settingsSections.account")}</Text>
        <View style={styles.menu}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileEditForm({ initialName, initialImage, onDone }: { initialName: string; initialImage: string; onDone: () => void }) {
  const { t } = useTranslation();
  const mutation = useUpdateCurrentAccount();
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);
  const valid = Boolean(name.trim()) && (!image.trim() || /^https?:\/\//i.test(image.trim()));
  const save = () => mutation.mutate(
    { name: name.trim(), image: image.trim() || null },
    {
      onSuccess: onDone,
      onError: (error) => Alert.alert(t("profile.edit.errorTitle"), error.message),
    },
  );
  return (
    <View style={styles.editForm}>
      <Text style={styles.editFormTitle}>{t("profile.edit.title")}</Text>
      <TextInput value={name} onChangeText={setName} maxLength={255} placeholder={t("profile.edit.name")} placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} />
      <TextInput value={image} onChangeText={setImage} autoCapitalize="none" autoCorrect={false} placeholder={t("profile.edit.image")} placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} />
      <View style={styles.editActions}>
        <Pressable onPress={onDone} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{t("common.cancel")}</Text></Pressable>
        <Pressable disabled={!valid || mutation.isPending} onPress={save} style={[styles.primaryAction, (!valid || mutation.isPending) && styles.disabled]}><Text style={styles.primaryActionText}>{mutation.isPending ? t("profile.edit.saving") : t("common.save")}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactIdentity: { padding: 12, gap: 8 },
  compactAvatar: { width: 48, height: 48, borderRadius: 24 },
  identityText: { flex: 1, minWidth: 0, gap: 4 },
  group: { gap: 12 },
  groupTitle: { paddingHorizontal: 4, color: travelSurfaces.foreground, fontSize: 19, lineHeight: 26, fontWeight: "600" },

  screen: {
    flex: 1,
    backgroundColor: theme.colors.light.background,
  },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  identity: { padding: 20, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: travelSurfaces.header },
  avatarContainer: { width: 64, height: 64, padding: 3, borderRadius: 32, backgroundColor: theme.colors.light.surface },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.gray[100],
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: travelSurfaces.info,
  },
  avatarInitial: {
    color: theme.colors.light.accent,
    fontSize: theme.typography.fontSize["3xl"],
    lineHeight: theme.typography.lineHeight["3xl"],
    fontWeight: "600",
  },
  name: { color: travelSurfaces.foreground, fontSize: 20, lineHeight: 27, fontWeight: "600" },
  editForm: { padding: 20, borderRadius: 24, gap: 16, backgroundColor: travelSurfaces.info },
  editFormTitle: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    paddingHorizontal: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[300],
    borderRadius: theme.radius.xl,
    color: theme.colors.light.gray[900],
    backgroundColor: theme.colors.light.surface,
  },
  editActions: {
    flexDirection: "row",
    gap: theme.spacing[2],
  },
  secondaryAction: { flex: 1, minHeight: 48, paddingVertical: 12, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surface },
  secondaryActionText: {
    color: theme.colors.light.gray[700],
    fontWeight: "600",
  },
  primaryAction: { flex: 1, minHeight: 48, paddingVertical: 12, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  primaryActionText: {
    color: theme.colors.light.base.white,
    fontWeight: "600",
  },
  disabled: { opacity: 0.45 },
  email: { color: travelSurfaces.secondary, fontSize: 13, lineHeight: 20 },
  phone: { color: travelSurfaces.secondary, fontSize: 12, lineHeight: 18 },
  editButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surface },
  menu: { paddingHorizontal: 16, borderWidth: 1, borderColor: theme.colors.light.separator, borderRadius: 24, backgroundColor: theme.colors.light.surface },
  languageSelector: {
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.light.gray[100],
    flexDirection: "row",
    gap: theme.spacing[3],
  },
  languageButton: { flex: 1, minHeight: 48, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.colors.light.surfaceSecondary },
  selectedLanguageButton: {
    borderColor: theme.colors.light.accent,
    backgroundColor: theme.colors.light.accent,
  },
  languageLabel: {
    color: theme.colors.light.gray[600],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
  selectedLanguageLabel: {
    color: theme.colors.light.accentForeground,
  },
});

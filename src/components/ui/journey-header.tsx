import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme, travelSurfaces } from "@/theme/theme";

type JourneyHeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
};

/** Shared heading for personal travel screens, using the saved sky/mint reference palette. */
export function JourneyHeader({ title, subtitle, showBack, onBack }: JourneyHeaderProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      {showBack || onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={onBack ?? (() => router.back())}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={22} color={travelSurfaces.foreground} />
        </Pressable>
      ) : null}
      <View style={styles.text}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: travelSurfaces.header, experimental_backgroundImage: travelSurfaces.headerGradient },
  back: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surface },
  text: { flex: 1, minWidth: 0, gap: 4 },
  title: { color: travelSurfaces.foreground, fontSize: 23, lineHeight: 30, fontWeight: "600" },
  subtitle: { color: travelSurfaces.secondary, fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.7 },
});

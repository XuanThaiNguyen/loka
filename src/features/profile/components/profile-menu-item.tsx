import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme, travelSurfaces } from "@/theme/theme";

type ProfileMenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
  isLast?: boolean;
  tone?: "default" | "danger";
};

export function ProfileMenuItem({
  icon,
  title,
  subtitle,
  onPress,
  isLast = false,
  tone = "default",
}: ProfileMenuItemProps) {
  const foreground =
    tone === "danger"
      ? theme.colors.light.danger
      : theme.colors.light.gray[900];

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, isLast && styles.lastRow, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={21} color={foreground} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: foreground }]}>{title}</Text>
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      {onPress ? <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.light.gray[400]}
      /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 80,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.light.gray[100],
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: travelSurfaces.info,
  },
  content: {
    flex: 1,
    gap: theme.spacing[1],
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "500",
  },
  subtitle: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});

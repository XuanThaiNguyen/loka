import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

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
      disabled={!onPress}
      onPress={onPress}
      style={[styles.row, isLast ? styles.lastRow : null]}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={21} color={foreground} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: foreground }]}>{title}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.light.gray[400]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
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
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.gray[50],
  },
  content: {
    flex: 1,
    gap: theme.spacing[1],
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "700",
  },
  subtitle: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { theme } from "@/theme/theme";

type HomeSectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  showLocationIcon?: boolean;
};

export function HomeSectionHeader({
  title,
  actionLabel,
  onActionPress,
  showLocationIcon = false,
}: HomeSectionHeaderProps) {
  const { fontScale } = useWindowDimensions();
  return (
    <View style={[styles.container, fontScale > 1.2 && { flexDirection: "column", alignItems: "flex-start", gap: 0 }]}>
      <View style={styles.titleGroup}>
        {showLocationIcon ? (
          <View style={styles.iconBadge}>
            <Ionicons
              name="location"
              size={20}
              color={theme.colors.light.base.white}
            />
          </View>
        ) : null}
        <Text style={styles.title}>
          {title}
        </Text>
      </View>

      {actionLabel && onActionPress ? <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={onActionPress}
        style={styles.action}
      >
        <Text style={styles.actionLabel}>{actionLabel}</Text>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={theme.colors.light.muted}
        />
      </Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[3],
  },
  titleGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.primary[500],
  },
  title: {
    flexShrink: 1,
    color: theme.colors.light.gray[900],
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "600",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    gap: 3,
  },
  actionLabel: {
    color: theme.colors.light.muted,
    fontSize: 12,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "400",
  },
});

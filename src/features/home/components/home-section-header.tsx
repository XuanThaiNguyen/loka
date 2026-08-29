import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

type HomeSectionHeaderProps = {
  title: string;
  actionLabel: string;
  onActionPress: () => void;
  showLocationIcon?: boolean;
};

export function HomeSectionHeader({
  title,
  actionLabel,
  onActionPress,
  showLocationIcon = false,
}: HomeSectionHeaderProps) {
  return (
    <View style={styles.container}>
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
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={onActionPress}
        style={styles.action}
      >
        <Text style={styles.actionLabel}>{actionLabel}</Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.light.accent}
        />
      </Pressable>
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
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "800",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionLabel: {
    color: theme.colors.light.accent,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
});

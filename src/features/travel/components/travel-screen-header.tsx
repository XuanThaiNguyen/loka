import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/theme/theme";

type TravelScreenHeaderProps = {
  title: string;
  showBack?: boolean;
};

export function TravelScreenHeader({
  title,
  showBack = false,
}: TravelScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing[2] }]}>
      <View style={styles.actionSlot}>
        {showBack ? (
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.light.gray[900]}
            />
          </Pressable>
        ) : null}
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={styles.actionSlot}>
        <Pressable
          accessibilityLabel="More options"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.moreButton}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={theme.colors.light.gray[900]}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 76,
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[3],
    flexDirection: "row",
    alignItems: "center",
  },
  actionSlot: {
    width: 44,
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.gray[100],
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "800",
    textAlign: "center",
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { HEADER_HORIZONTAL_PADDING } from "@/features/home/home.constants";
import { theme } from "@/theme/theme";

type HomeHeroProps = {
  onHeightChange: (height: number) => void;
  opacity: SharedValue<number>;
  top: number;
};

export function HomeHero({ onHeightChange, opacity, top }: HomeHeroProps) {
  const { t } = useTranslation();
  const visibilityStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      onLayout={(event) => onHeightChange(event.nativeEvent.layout.height)}
      pointerEvents="box-none"
      style={[styles.container, { top }, visibilityStyle]}
    >
      <Pressable style={styles.searchPill}>
        <Text style={styles.searchNumber}>6</Text>
        <Text numberOfLines={1} style={styles.searchText}>
          {t("home.searchPlaceholder")}
        </Text>
        <Ionicons
          name="search"
          size={28}
          color={theme.colors.light.gray[300]}
        />
      </Pressable>

      <View style={styles.checkInRow}>
        <Text style={styles.checkInHelper}>{t("home.checkInHelper")}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingHorizontal: HEADER_HORIZONTAL_PADDING,
    gap: 22,
    zIndex: 1,
  },
  searchPill: {
    minHeight: 58,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.base.white,
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 14,
  },
  searchNumber: {
    color: theme.colors.light.gray[600],
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: "800",
  },
  searchText: {
    flex: 1,
    color: theme.colors.light.gray[600],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "500",
  },
  checkInRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 48,
  },
  checkInHelper: {
    flex: 1,
    color: theme.colors.light.grayBlue[50],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "600",
  },
});

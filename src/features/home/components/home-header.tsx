import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useAuth } from "@/features/auth/auth-provider";
import { useNotifications } from "@/features/notifications/services/notifications-api-service";
import {
  HEADER_HORIZONTAL_PADDING,
  HEADER_TOP_HEIGHT,
  HEADER_VERTICAL_PADDING,
} from "@/features/home/home.constants";
import { theme, travelSurfaces } from "@/theme/theme";

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

type HomeHeaderProps = {
  tintProgress: SharedValue<number>;
  topInset: number;
  onHeightChange?: (height: number) => void;
};

export function HomeHeader({ tintProgress, topInset, onHeightChange }: HomeHeaderProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const notifications = useNotifications();
  const pendingCount = !notifications.isError ? notifications.data?.length ?? 0 : 0;
  const userName =
    session?.user.name?.trim() ||
    session?.user.email.split("@")[0] ||
    t("home.userName");
  const userInitial = userName.charAt(0).toLocaleUpperCase();

  const primaryTintStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      tintProgress.value,
      [0, 1],
      [travelSurfaces.foreground, travelSurfaces.foreground],
    ),
  }));

  const secondaryTintStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      tintProgress.value,
      [0, 1],
      [travelSurfaces.secondary, travelSurfaces.secondary],
    ),
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      tintProgress.value,
      [0, 1],
      [theme.colors.light.gray[100], theme.colors.light.base.white],
    ),
  }));

  return (
    <View
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height - topInset)}
      style={[
        styles.container,
        {
          paddingTop: topInset + HEADER_VERTICAL_PADDING,
          paddingBottom: HEADER_VERTICAL_PADDING,
        },
      ]}
    >
      <View style={styles.topBar}>
        <View style={styles.userCluster}>
          <Animated.View style={[styles.avatar, avatarStyle]}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </Animated.View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Animated.Text style={[styles.userEyebrow, secondaryTintStyle]}>
              {t("home.userEyebrow")}
            </Animated.Text>
            <Animated.Text numberOfLines={2} style={[styles.userName, primaryTintStyle]}>
              {userName}
            </Animated.Text>
          </View>
        </View>

        <View style={styles.iconCluster}>
          <HeaderIcon
            name="search"
            onPress={() => router.push("/search")}
            accessibilityLabel={t("home.search")}
            tintProgress={tintProgress}
          />
          <HeaderIcon
            name="notifications-outline"
            onPress={() => router.push("/notifications")}
            accessibilityLabel={pendingCount > 0 ? t("notifications.bellPending", { count: pendingCount }) : t("home.notifications")}
            tintProgress={tintProgress}
            hasBadge={pendingCount > 0}
          />
        </View>
      </View>
    </View>
  );
}

function HeaderIcon({
  name,
  accessibilityLabel,
  tintProgress,
  hasBadge,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  tintProgress: SharedValue<number>;
  hasBadge?: boolean;
  onPress?: () => void;
}) {
  const tintStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      tintProgress.value,
      [0, 1],
      [travelSurfaces.foreground, travelSurfaces.foreground],
    ),
  }));

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.iconButton}>
      <AnimatedIonicons name={name} size={28} style={tintStyle} />
      {hasBadge ? <View style={styles.notificationBadge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: HEADER_HORIZONTAL_PADDING,
    zIndex: 10,
  },
  topBar: {
    minHeight: HEADER_TOP_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  userCluster: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.base.white,
  },
  avatarText: {
    color: theme.colors.light.accent,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  userEyebrow: {
    color: travelSurfaces.secondary,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: "600",
  },
  userName: {
    color: travelSurfaces.foreground,
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "800",
  },
  iconCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.error[500],
    borderWidth: 1.5,
    borderColor: theme.colors.light.base.white,
  },
});

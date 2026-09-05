import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname } from "expo-router";
import type { ReactNode } from "react";
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { theme } from "@/theme/theme";

type TabBarButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  activeIconName: keyof typeof Ionicons.glyphMap;
  routePath: string;
  prominent?: boolean;
  accessibilityState?: {
    selected?: boolean;
  };
  children?: ReactNode;
  href?: string;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
};

const TAB_BUTTON_HEIGHT = 48;

export function TabBarButton({
  label,
  iconName,
  activeIconName,
  routePath,
  prominent = false,
  accessibilityState,
  children: _children,
  href: _href,
  style: _style,
  ...pressableProps
}: TabBarButtonProps) {
  const pathname = usePathname();
  const isSelected = Boolean(accessibilityState?.selected) || pathname === routePath;
  const color = isSelected ? theme.colors.light.accent : theme.colors.light.gray[500];

  if (prominent) {
    return (
      <Pressable
        {...pressableProps}
        accessibilityLabel={label}
        accessibilityState={accessibilityState}
        style={styles.prominentButton}
      >
        <View style={styles.prominentIcon}>
          <Ionicons
            name={isSelected ? activeIconName : iconName}
            size={28}
            color={theme.colors.light.accentForeground}
          />
        </View>
        <Text numberOfLines={1} style={[styles.prominentLabel, { color }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      {...pressableProps}
      accessibilityState={accessibilityState}
      style={styles.button}
    >
      <View style={styles.content}>
        <Ionicons
          name={isSelected ? activeIconName : iconName}
          size={24}
          color={color}
        />
        <Text
          numberOfLines={1}
          style={{
            color,
            fontSize: theme.typography.fontSize.xs,
            lineHeight: theme.typography.lineHeight.xs,
            fontWeight: isSelected ? "700" : "600",
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = {
  button: {
    flex: 1,
    minHeight: TAB_BUTTON_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  } satisfies ViewStyle,
  content: {
    alignItems: "center",
    gap: 2,
  } satisfies ViewStyle,
  prominentButton: {
    flex: 1,
    minHeight: TAB_BUTTON_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "visible",
  } satisfies ViewStyle,
  prominentIcon: {
    width: 58,
    height: 58,
    marginTop: -18,
    borderRadius: theme.radius.full,
    borderWidth: 4,
    borderColor: theme.colors.light.base.white,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.accent,
    shadowColor: theme.colors.light.base.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  } satisfies ViewStyle,
  prominentLabel: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
  } satisfies TextStyle,
};

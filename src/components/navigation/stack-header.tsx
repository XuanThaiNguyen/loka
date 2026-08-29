import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "heroui-native/button";
import { Typography } from "heroui-native/text";
import { View } from "react-native";
import { useThemeColor } from "heroui-native/hooks";

type StackHeaderProps = {
  title: string;
  subtitle?: string;
  rightAction?: {
    accessibilityLabel: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
};

export function StackHeader({ title, subtitle, rightAction }: StackHeaderProps) {
  const muted = useThemeColor("muted");

  return (
    <View className="flex-row items-start justify-between gap-4">
      <View className="flex-1 gap-1">
        <Typography.Heading type="h2">{title}</Typography.Heading>
        {subtitle ? (
          <Typography.Paragraph color="muted">{subtitle}</Typography.Paragraph>
        ) : null}
      </View>

      {rightAction ? (
        <Button
          isIconOnly
          variant="secondary"
          accessibilityLabel={rightAction.accessibilityLabel}
          onPress={rightAction.onPress}
        >
          <Ionicons name={rightAction.icon} size={20} color={muted} />
        </Button>
      ) : null}
    </View>
  );
}

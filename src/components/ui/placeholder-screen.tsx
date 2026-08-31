import { Typography } from "heroui-native/text";
import { ScrollView, View } from "react-native";

import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { theme } from "@/theme/theme";

type PlaceholderScreenProps = {
  title: string;
  description: string;
};

export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  const bottomPadding = useTabBottomPadding();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: theme.spacing[5],
        paddingTop: theme.spacing[5],
        paddingBottom: bottomPadding,
        justifyContent: "center",
      }}
    >
      <View style={{ gap: theme.spacing[2] }}>
        <Typography.Heading type="h2">{title}</Typography.Heading>
        <Typography.Paragraph color="muted">{description}</Typography.Paragraph>
      </View>
    </ScrollView>
  );
}

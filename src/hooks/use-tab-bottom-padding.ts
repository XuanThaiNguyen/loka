import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/constants/layout";

export function useTabBottomPadding() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + (Platform.OS === "android" ? insets.bottom : 0) + 16;
}

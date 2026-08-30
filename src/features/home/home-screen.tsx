import BottomSheet from "@gorhom/bottom-sheet";
import { useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { HomeHeader } from "@/features/home/components/home-header";
import { HomeHero } from "@/features/home/components/home-hero";
import { HomeSheetContent } from "@/features/home/components/home-sheet-content";
import {
  FIXED_HEADER_HEIGHT,
  SCREEN_FADE_THRESHOLD,
  TOP_OVERLAY_FALLBACK_HEIGHT,
} from "@/features/home/home.constants";
import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { theme } from "@/theme/theme";

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useTabBottomPadding();
  const { height } = useWindowDimensions();
  const [sceneHeight, setSceneHeight] = useState(
    Math.max(height - TAB_BAR_HEIGHT - insets.bottom, 0),
  );
  const [heroHeight, setHeroHeight] = useState(TOP_OVERLAY_FALLBACK_HEIGHT);
  const animatedIndex = useSharedValue(0);

  const backgroundOpacity = useDerivedValue(() => {
    const progress = Math.min(Math.max(animatedIndex.value, 0), 1);

    if (progress <= SCREEN_FADE_THRESHOLD) {
      return 1;
    }

    return interpolate(
      progress,
      [SCREEN_FADE_THRESHOLD, 1],
      [1, 0],
      Extrapolation.CLAMP,
    );
  });

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const snapPoints = useMemo(() => {
    const fixedHeaderBottom = insets.top + FIXED_HEADER_HEIGHT;
    const collapsed = Math.round(
      sceneHeight - fixedHeaderBottom - heroHeight + 34,
    );
    const expanded = Math.round(sceneHeight - fixedHeaderBottom);

    return [Math.max(collapsed, 360), Math.max(expanded, collapsed + 120)];
  }, [heroHeight, insets.top, sceneHeight]);

  return (
    <View
      onLayout={(event) => {
        const nextHeight = event.nativeEvent.layout.height;
        if (nextHeight > 0 && Math.abs(nextHeight - sceneHeight) > 1) {
          setSceneHeight(nextHeight);
        }
      }}
      style={styles.container}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.background, backgroundStyle]}
      />

      <HomeHeader tintProgress={backgroundOpacity} topInset={insets.top} />

      <HomeHero
        top={insets.top + FIXED_HEADER_HEIGHT}
        opacity={backgroundOpacity}
        onHeightChange={(nextHeight) => {
          if (nextHeight > 0 && Math.abs(nextHeight - heroHeight) > 1) {
            setHeroHeight(nextHeight);
          }
        }}
      />

      <View style={styles.sheetHost} pointerEvents="box-none">
        <BottomSheet
          index={0}
          animatedIndex={animatedIndex}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          backgroundStyle={styles.sheetBackground}
          handleStyle={styles.sheetHandleArea}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <HomeSheetContent bottomPadding={bottomPadding} />
        </BottomSheet>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.light.background,
  },
  background: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.light.header,
    zIndex: 0,
  },
  sheetHost: {
    flex: 1,
    zIndex: 2,
  },
  sheetBackground: {
    backgroundColor: theme.colors.light.background,
    borderTopLeftRadius: theme.radius["3xl"],
    borderTopRightRadius: theme.radius["3xl"],
  },
  sheetHandleArea: {
    borderTopLeftRadius: theme.radius["3xl"],
    borderTopRightRadius: theme.radius["3xl"],
    paddingTop: 4,
    paddingBottom: 4,
  },
  sheetHandle: {
    opacity: 0,
  },
});

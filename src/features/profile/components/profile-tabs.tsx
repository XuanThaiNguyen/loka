import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

const c = theme.colors.light;

const profileTabs = ["trips", "photos", "saved"] as const;

export function ProfileTabs({ children }: { children: ReactNode[] }) {
  const { t } = useTranslation();
  const pager = useRef<ScrollView>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  const selectedIndex = useRef(0);
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    // Keep the selected page aligned when the viewport changes (rotation / split view).
    pager.current?.scrollTo({ x: selectedIndex.current * width, animated: false });
    scrollX.setValue(selectedIndex.current * width);
  }, [width, scrollX]);

  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
    <View accessibilityRole="tablist" style={styles.tabBar}>
      {profileTabs.map((tab, tabIndex) => <Pressable
        key={tab}
        accessibilityRole="tab"
        accessibilityState={{ selected: index === tabIndex }}
        onPress={() => {
          selectedIndex.current = tabIndex;
          setIndex(tabIndex);
          pager.current?.scrollTo({ x: tabIndex * width, animated: true });
        }}
        style={styles.tab}
      ><Text style={[styles.tabLabel, index === tabIndex && styles.activeTabLabel]}>{t(`profileLayout.${tab}`)}</Text></Pressable>)}
      {width > 0 ? <Animated.View pointerEvents="none" style={[styles.indicator, {
        width: (width - 40) / 3,
        transform: [{ translateX: scrollX.interpolate({ inputRange: [0, width * 2], outputRange: [0, (width - 40) * 2 / 3], extrapolate: "clamp" }) }],
      }]} /> : null}
    </View>
    {width > 0 ? <Animated.ScrollView
      ref={pager}
      horizontal
      pagingEnabled
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      bounces={false}
      scrollEventThrottle={16}
      style={{ height: heights[index] ?? 260, flexGrow: 0 }}
      contentContainerStyle={{ alignItems: "flex-start" }}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
      onMomentumScrollEnd={(event) => {
        const nextIndex = Math.max(0, Math.min(2, Math.round(event.nativeEvent.contentOffset.x / width)));
        selectedIndex.current = nextIndex;
        setIndex(nextIndex);
      }}
    >
      {children.map((child, pageIndex) => <View
        key={profileTabs[pageIndex]}
        style={{ width, minHeight: 260 }}
        accessibilityElementsHidden={index !== pageIndex}
        importantForAccessibility={index === pageIndex ? "auto" : "no-hide-descendants"}
        onLayout={(event) => {
          const height = Math.ceil(event.nativeEvent.layout.height);
          setHeights((previous) => {
            if (previous[pageIndex] === height) return previous;
            const next = [...previous];
            next[pageIndex] = height;
            return next;
          });
        }}
      >{child}</View>)}
    </Animated.ScrollView> : null}
  </View>;
}

const styles = StyleSheet.create({
  tabBar: { marginHorizontal: 20, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.separator },
  tab: { flex: 1, minHeight: 50, alignItems: "center", justifyContent: "center" },
  tabLabel: { color: c.muted, fontSize: 15, lineHeight: 22 },
  activeTabLabel: { color: c.foreground, fontWeight: "600" },
  indicator: { position: "absolute", bottom: -1, left: 0, height: 2, backgroundColor: c.foreground },
});

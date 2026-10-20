import { router, Stack, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Keyboard, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarButton } from "@/components/navigation/tab-bar-button";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { theme } from "@/theme/theme";

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />
      <Tabs
        tabBar={({ state, descriptors, navigation }) => keyboardVisible ? null : (
          <View style={{ flexDirection: "row", height: TAB_BAR_HEIGHT + insets.bottom, paddingTop: 4, paddingBottom: insets.bottom, backgroundColor: theme.colors.light.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: theme.colors.light.foreground, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 8 }}>
            {state.routes.flatMap((route, index) => {
              const selected = state.index === index;
              const button = descriptors[route.key].options.tabBarButton?.({
                accessibilityRole: "tab",
                accessibilityLabel: descriptors[route.key].options.tabBarAccessibilityLabel,
                accessibilityState: { selected },
                onPress: () => {
                  const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                  if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
                },
                onLongPress: () => navigation.emit({ type: "tabLongPress", target: route.key }),
                children: null,
              });
              const item = <View key={route.key} style={{ flex: 1 }}>{button}</View>;
              return index === 1 ? [item, <View key="create-action" style={{ flex: 1 }}><TabBarButton accessibilityRole="button" accessibilityState={{ selected: false }} label={t("tabs.explore")} iconName="add" activeIconName="add" routePath="/trip/new" prominent onPress={() => router.push("/trip/new")} /></View>] : [item];
            })}
          </View>
        )}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarItemStyle: {
            overflow: "visible",
          },
          tabBarStyle: {
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingTop: 4,
            paddingBottom: insets.bottom,
            backgroundColor: theme.colors.light.surface,
            borderTopWidth: 0,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            shadowColor: theme.colors.light.foreground,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 8,
            overflow: "visible",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.home"),
            tabBarAccessibilityLabel: t("tabs.home"),
            tabBarButton: (props) => (
              <TabBarButton
                {...props}
                label={t("tabs.home")}
                iconName="home-outline"
                activeIconName="home"
                routePath="/"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: t("tabs.trips"),
            tabBarAccessibilityLabel: t("tabs.trips"),
            tabBarButton: (props) => (
              <TabBarButton
                {...props}
                label={t("tabs.trips")}
                iconName="compass-outline"
                activeIconName="compass"
                routePath="/trips"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: t("tabs.favorites"),
            tabBarAccessibilityLabel: t("tabs.favorites"),
            tabBarButton: (props) => (
              <TabBarButton
                {...props}
                label={t("tabs.favorites")}
                iconName="heart-outline"
                activeIconName="heart"
                routePath="/favorites"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tabs.profile"),
            tabBarAccessibilityLabel: t("tabs.profile"),
            tabBarButton: (props) => (
              <TabBarButton
                {...props}
                label={t("tabs.profile")}
                iconName="person-outline"
                activeIconName="person"
                routePath="/profile"
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

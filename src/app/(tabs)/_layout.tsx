import { Stack, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarButton } from "@/components/navigation/tab-bar-button";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { theme } from "@/theme/theme";

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />
      <Tabs
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
            backgroundColor: theme.colors.light.background,
            borderTopColor: theme.colors.light.gray[200],
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
          name="explore"
          options={{
            title: t("tabs.explore"),
            tabBarAccessibilityLabel: t("tabs.explore"),
            tabBarButton: (props) => (
              <TabBarButton
                {...props}
                label={t("tabs.explore")}
                iconName="paper-plane"
                activeIconName="paper-plane"
                routePath="/explore"
                prominent
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

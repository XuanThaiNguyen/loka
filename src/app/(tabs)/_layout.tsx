import { Stack, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabBarButton } from "@/components/core/tab-bar-button";
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

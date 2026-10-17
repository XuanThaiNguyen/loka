import { router } from "expo-router";
import { Button } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import { theme } from "@/theme/theme";

/** Historical booking deep links stay safe while the app focuses on travel knowledge. */
export function CreateBookingScreen() {
  const { t } = useTranslation();
  return <View style={{ flex: 1, backgroundColor: theme.colors.light.background }}>
    <TravelScreenHeader title={t("bookingCreate.header")} showBack />
    <View style={{ padding: 24, gap: 20 }}>
      <Text style={{ color: theme.colors.light.foreground, fontSize: 17, lineHeight: 26 }}>{t("catalogContent.bookingPaused")}</Text>
      <Button onPress={() => router.replace("/trip/new")}><Button.Label>{t("trips.createTrip")}</Button.Label></Button>
    </View>
  </View>;
}

import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Button } from "heroui-native/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import {
  destinations,
  galleryImages,
  getDestination,
} from "@/features/travel/travel.data";
import { theme } from "@/theme/theme";

const visitorColors = [
  theme.colors.light.primary[300],
  theme.colors.light.orange[300],
  theme.colors.light.blue[300],
  theme.colors.light.green[300],
  theme.colors.light.gray[300],
] as const;

export function DestinationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isFavorite, setIsFavorite] = useState(false);
  const destination = getDestination(id) ?? destinations[0];
  const title = t(`travel.destinations.${destination.id}.title`);

  return (
    <View style={styles.screen}>
      <TravelScreenHeader title={t("travel.detail.title")} showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Image
          source={{ uri: destination.image }}
          style={styles.heroImage}
          contentFit="cover"
        />

        <View style={styles.pagination}>
          {[0, 1, 2, 3].map((dot) => (
            <View
              key={dot}
              style={[styles.dot, dot === 1 ? styles.activeDot : null]}
            />
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryText}>
            <Text style={styles.destinationTitle}>{title}</Text>
            <View style={styles.metadataRow}>
              <Ionicons
                name="location"
                size={18}
                color={theme.colors.light.accent}
              />
              <Text numberOfLines={1} style={styles.metadataText}>
                {t(`travel.destinations.${destination.id}.location`)}
              </Text>
              <Ionicons
                name="star"
                size={16}
                color={theme.colors.light.warning}
              />
              <Text style={styles.metadataText}>{destination.rating}</Text>
            </View>
          </View>

          <Button
            isIconOnly
            variant="secondary"
            accessibilityLabel={t("travel.toggleFavorite", { title })}
            onPress={() => setIsFavorite((current) => !current)}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={26}
              color={
                isFavorite
                  ? theme.colors.light.error[500]
                  : theme.colors.light.gray[900]
              }
            />
          </Button>
        </View>

        <View style={styles.visitors}>
          <View style={styles.avatarStack}>
            {visitorColors.map((color, index) => (
              <View
                key={`${color}-${index}`}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: color,
                    marginLeft: index === 0 ? 0 : -8,
                  },
                ]}
              >
                <Text style={styles.avatarText}>{index + 1}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.visitorText}>
            <Text style={styles.visitorCount}>{destination.visitors} </Text>
            {t("travel.detail.peopleVisited")}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("travel.detail.details")}</Text>
          <Text style={styles.description}>
            {t(`travel.destinations.${destination.id}.description`)}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("travel.detail.galleries")}</Text>
            <Text style={styles.seeAll}>{t("common.viewAll")}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}
          >
            {galleryImages.map((image, index) => (
              <View key={image}>
                <Image
                  source={{ uri: image }}
                  style={styles.galleryImage}
                  contentFit="cover"
                />
                {index === galleryImages.length - 1 ? (
                  <View style={styles.galleryCount}>
                    <Text style={styles.galleryCountText}>12+</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View
        style={[
          styles.checkoutBar,
          { paddingBottom: Math.max(insets.bottom, theme.spacing[3]) },
        ]}
      >
        <View>
          <Text style={styles.priceEyebrow}>{t("travel.detail.startFrom")}</Text>
          <Text style={styles.checkoutPrice}>
            ${destination.price.toFixed(2)}
            <Text style={styles.perPerson}>/{t("travel.detail.person")}</Text>
          </Text>
        </View>
        <Button variant="primary" style={styles.checkoutButton}>
          <Button.Label>{t("travel.detail.checkout")}</Button.Label>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing[5],
    paddingBottom: theme.spacing[8],
  },
  heroImage: {
    width: "100%",
    aspectRatio: 1.4,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.gray[100],
  },
  pagination: {
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.gray[200],
  },
  activeDot: {
    backgroundColor: theme.colors.light.accent,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[4],
  },
  summaryText: {
    flex: 1,
    gap: theme.spacing[2],
  },
  destinationTitle: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize["2xl"],
    lineHeight: theme.typography.lineHeight["2xl"],
    fontWeight: "900",
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  metadataText: {
    flexShrink: 1,
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  visitors: {
    marginTop: theme.spacing[5],
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  avatarStack: {
    flexDirection: "row",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.light.base.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.colors.light.gray[800],
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
  },
  visitorText: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  visitorCount: {
    color: theme.colors.light.accent,
    fontWeight: "800",
  },
  divider: {
    height: 8,
    marginHorizontal: -theme.spacing[5],
    marginTop: theme.spacing[5],
    backgroundColor: theme.colors.light.gray[50],
  },
  section: {
    gap: theme.spacing[3],
    paddingTop: theme.spacing[5],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: "800",
  },
  description: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  seeAll: {
    color: theme.colors.light.accent,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
  gallery: {
    gap: theme.spacing[3],
    paddingRight: theme.spacing[5],
  },
  galleryImage: {
    width: 112,
    height: 86,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.gray[100],
  },
  galleryCount: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 24, 40, 0.46)",
  },
  galleryCountText: {
    color: theme.colors.light.base.white,
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "800",
  },
  checkoutBar: {
    paddingTop: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
    borderTopWidth: 1,
    borderTopColor: theme.colors.light.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[4],
    backgroundColor: theme.colors.light.background,
  },
  priceEyebrow: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  checkoutPrice: {
    color: theme.colors.light.accent,
    fontSize: theme.typography.fontSize["2xl"],
    lineHeight: theme.typography.lineHeight["2xl"],
    fontWeight: "900",
  },
  perPerson: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "500",
  },
  checkoutButton: {
    minWidth: 148,
  },
});

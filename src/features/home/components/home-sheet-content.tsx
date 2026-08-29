import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { HomeSectionHeader } from "@/features/home/components/home-section-header";
import { travelCities } from "@/features/travel/city.data";
import { DestinationCard } from "@/features/travel/components/destination-card";
import {
  getCollectionDestinations,
  travelCollections,
  type TravelCollection,
} from "@/features/travel/travel.data";
import { theme } from "@/theme/theme";

type HomeSheetContentProps = {
  bottomPadding: number;
};

export function HomeSheetContent({ bottomPadding }: HomeSheetContentProps) {
  const { t } = useTranslation();

  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
    >
      <View style={styles.section}>
        <HomeSectionHeader
          title={t("home.exploreCity")}
          actionLabel={t("common.viewAll")}
          onActionPress={() => router.push("/explore")}
          showLocationIcon
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityList}
        >
          {travelCities.map((city) => (
            <Pressable
              key={city.id}
              onPress={() =>
                router.push({
                  pathname: "/city/[id]",
                  params: { id: city.id },
                })
              }
              style={styles.cityItem}
            >
              <Image
                source={{ uri: city.image }}
                style={styles.cityImage}
                contentFit="cover"
              />
              <Text numberOfLines={1} style={styles.cityLabel}>
                {t(`travel.cities.${city.id}.name`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {travelCollections.map((collection) => (
        <DestinationSection key={collection.slug} collection={collection} />
      ))}
    </BottomSheetScrollView>
  );
}

function DestinationSection({ collection }: { collection: TravelCollection }) {
  const { t } = useTranslation();
  const items = getCollectionDestinations(collection);

  return (
    <View style={styles.section}>
      <HomeSectionHeader
        title={t(`travel.collections.${collection.slug}`)}
        actionLabel={t("common.viewAll")}
        onActionPress={() =>
          router.push({
            pathname: "/collection/[slug]",
            params: { slug: collection.slug },
          })
        }
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.destinationList}
      >
        {items.map((item) => (
          <DestinationCard
            key={item.id}
            destination={item}
            onPress={() =>
              router.push({
                pathname: "/destination/[id]",
                params: { id: item.id },
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing[8],
  },
  section: {
    gap: theme.spacing[4],
    paddingHorizontal: theme.spacing[5],
  },
  cityList: {
    gap: theme.spacing[4],
    paddingRight: theme.spacing[5],
  },
  cityItem: {
    width: 68,
    alignItems: "center",
    gap: theme.spacing[2],
  },
  cityImage: {
    width: 68,
    height: 68,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.gray[100],
  },
  cityLabel: {
    width: "100%",
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  destinationList: {
    gap: theme.spacing[3],
    paddingRight: theme.spacing[5],
  },
});

import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DestinationListItem } from "@/features/travel/components/destination-list-item";
import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import {
  getCollection,
  getCollectionDestinations,
  travelCollections,
} from "@/features/travel/travel.data";
import { theme } from "@/theme/theme";

export function CollectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const collection = getCollection(slug) ?? travelCollections[0];
  const items = getCollectionDestinations(collection);

  return (
    <View style={styles.screen}>
      <TravelScreenHeader
        title={t(`travel.collections.${collection.slug}`)}
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing[6] },
        ]}
      >
        <Text style={styles.resultCount}>
          {t("travel.collectionResultCount", { count: items.length })}
        </Text>
        {items.map((destination) => (
          <DestinationListItem
            key={destination.id}
            destination={destination}
            onPress={() =>
              router.push({
                pathname: "/destination/[id]",
                params: { id: destination.id },
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.light.background,
  },
  content: {
    paddingHorizontal: theme.spacing[5],
    gap: theme.spacing[4],
  },
  resultCount: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "600",
  },
});

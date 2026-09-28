import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "heroui-native";

import { AddDestinationToTrip } from "@/features/travel/components/add-destination-to-trip";
import { CityExpandableText } from "@/features/travel/components/city-editorial-sections";
import { guideWash } from "@/features/travel/city-guide";
import { DestinationListItem } from "@/features/travel/components/destination-list-item";
import { DetailAction, DetailSection, DetailState, GuideRows, PhotoGallery, detailStyles as s, openPlaceMap } from "@/features/travel/components/detail-ui";
import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import { VisitProfileCard } from "@/features/travel/components/visit-profile-card";
import { useCity, useDestination, useFavoriteMutation } from "@/features/travel/services/travel-api-service";
import { theme } from "@/theme/theme";

export function DestinationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DestinationContent key={id} id={id} />;
}

function DestinationContent({ id }: { id: string }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const query = useDestination(id);
  const { destination: place } = query;
  const cityQuery = useCity(place.id === id ? place.cityId : undefined);
  const favorite = useFavoriteMutation();
  const [adding, setAdding] = useState(false);
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null);
  const saved = favoriteOverride ?? place.isFavorite ?? false;
  const unavailable = !query.data && place.id !== id;
  const title = place.title ?? t(`travel.destinations.${place.id}.title`);
  const location = place.location ?? t(`travel.destinations.${place.id}.location`);
  const gallery = [place.image, ...(place.gallery ?? [])];
  const nearby = cityQuery.data?.id === place.cityId ? (cityQuery.city.relatedDestinations ?? []).filter((item) => item.id !== place.id).slice(0, 4) : [];
  const money = (amount: number, currency = place.currency ?? "USD") => new Intl.NumberFormat(i18n.language, { style: "currency", currency }).format(amount);
  const curated = place.lastCuratedAt ? new Date(place.lastCuratedAt) : null;
  const toggleFavorite = () => {
    if (favorite.isPending) return;
    const previous = saved;
    setFavoriteOverride(!saved);
    favorite.mutate({ destinationId: place.id, favorite: !saved }, {
      onError: () => { setFavoriteOverride(previous); Alert.alert(t("detailGuide.saveError")); },
    });
  };

  return <View style={{ flex: 1, backgroundColor: theme.colors.light.background }}>
    <TravelScreenHeader title={t("travel.detail.title")} showBack />
    {unavailable ? <DetailState loading={query.isFetching} onRetry={() => void query.refetch()} /> : <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 32 }}>
        <View style={{ gap: 16, padding: 18, borderRadius: 28, backgroundColor: "#ffe6d5", experimental_backgroundImage: "linear-gradient(135deg, #ffe6d5 0%, #ffd7e8 58%, #e6d8ff 100%)" }}>
          <Image source={{ uri: place.image }} style={{ width: "100%", aspectRatio: 1.35, borderRadius: 24 }} contentFit="cover" />
          <Text selectable style={s.title}>{title}</Text>
          <Text selectable style={s.body}>{location}</Text>
          {place.cityId ? <Button size="sm" variant="secondary" onPress={() => router.push({ pathname: "/city/[id]", params: { id: place.cityId! } })}><Button.Label>{t("detailGuide.exploreAll")}</Button.Label></Button> : null}
          {place.isFeatured ? <Text style={s.actionText}>{t("visitKnowledge.featured")}</Text> : null}
          {place.visitorCount != null && place.visitorCount > 0 ? <Text selectable style={s.body}>{t("visitKnowledge.visitors", { count: place.visitorCount })}</Text> : null}
          {place.popularityRank != null ? <Text selectable style={s.body}>{t("visitKnowledge.rank", { rank: place.popularityRank })}</Text> : null}
          <View style={s.wrap}><Ionicons name="star" color={theme.colors.light.warning} size={18} /><Text selectable style={s.label}>{place.ratingCount !== 0 && Number(place.rating) > 0 ? place.rating : t("detailGuide.unrated")}</Text>{place.ratingCount != null && <Text selectable style={s.body}>{t("detailGuide.ratings", { count: place.ratingCount })}</Text>}</View>
          <View style={s.wrap}>{[...new Set([t(`detailGuide.categories.${place.category}`), ...(place.tags ?? []), ...(place.guide?.bestFor ?? [])])].map((tag) => <View key={tag} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.colors.light.accentSoft }}><Text style={s.actionText}>{tag}</Text></View>)}</View>
          <View style={s.wrap}>
            <DetailAction label={saved ? t("detailGuide.saved") : t("detailGuide.save")} icon={saved ? "heart" : "heart-outline"} disabled={!place.apiBacked || favorite.isPending} onPress={toggleFavorite} />
            <DetailAction label={t("detailGuide.openMap")} icon="navigate-outline" onPress={() => openPlaceMap(`${title}, ${place.guide?.address ?? location}`, t("detailGuide.mapError"), place)} />
          </View>
        </View>

        <DetailSection title={t("travel.detail.details")}>
          <View style={{ padding: 22, borderRadius: 24, ...guideWash("coral") }}><CityExpandableText text={place.description || t("detailGuide.noDescription")} /></View>
          {curated && !Number.isNaN(curated.getTime()) ? <Text style={s.body}>{t("detailGuide.updated", { date: new Intl.DateTimeFormat(i18n.language).format(curated) })}</Text> : null}
        </DetailSection>

        <DetailSection title={t("detailGuide.beforeYouGo")}>
          <View style={[s.card, guideWash("mint")]}><Text style={s.label}>{t("detailGuide.location")}</Text><Text selectable style={s.body}>{place.guide?.address ?? location}</Text>
            {!place.guide?.address && <Text style={s.body}>{t("detailGuide.addressHint")}</Text>}
          </View>
          {place.openingHours ? <View style={[s.card, guideWash("sky")]}><Text style={s.label}>{t("travel.detail.openingHours")}</Text><Text selectable style={s.body}>{place.openingHours}</Text></View> : null}
          <GuideRows guide={place.guide} />
          {place.apiBacked ? <VisitProfileCard key={place.id} id={place.id} /> : null}
          {place.tips ? <View style={[s.card, guideWash("lilac")]}><Text style={s.label}>{t("travel.detail.visitorTip")}</Text><CityExpandableText text={place.tips} /></View> : null}
        </DetailSection>

        <DetailSection title={t("detailGuide.tickets")}>
          <View style={s.card}>
            <Text selectable style={s.label}>{place.pricingTiers ? t("detailGuide.adult") : t("travel.detail.startFrom")}: {money(place.pricingTiers?.adult ?? place.price, place.pricingTiers?.currency)}</Text>
            {place.pricingTiers?.childSenior != null && <Text selectable style={s.body}>{t("detailGuide.childSenior")}: {money(place.pricingTiers.childSenior, place.pricingTiers.currency)}</Text>}
            {place.pricingTiers?.approxUsdAdult != null && <Text selectable style={s.body}>{t("visitKnowledge.approxUsd")}: {money(place.pricingTiers.approxUsdAdult, "USD")} ({t("detailGuide.adult")})</Text>}
            {place.pricingTiers?.approxUsdChildSenior != null && <Text selectable style={s.body}>{t("visitKnowledge.approxUsd")}: {money(place.pricingTiers.approxUsdChildSenior, "USD")} ({t("detailGuide.childSenior")})</Text>}
            {place.pricingTiers?.notes ? <Text selectable style={s.body}>{place.pricingTiers.notes}</Text> : null}
            <Text style={s.body}>{t("detailGuide.ticketHint")}</Text>
          </View>
        </DetailSection>

        <PhotoGallery images={gallery} title={t("travel.detail.galleries")} />
        {nearby.length ? <DetailSection title={t("detailGuide.sameCity")}><Text style={s.body}>{t("detailGuide.sameCityHint")}</Text>{nearby.map((destination) => <DestinationListItem key={destination.id} destination={destination} onPress={() => router.push({ pathname: "/destination/[id]", params: { id: destination.id } })} />)}<DetailAction label={t("detailGuide.exploreAll")} icon="arrow-forward" onPress={() => router.push({ pathname: "/city/[id]", params: { id: place.cityId! } })} /></DetailSection> : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, borderTopColor: theme.colors.light.gray[200], gap: 8 }}>
        <Button isDisabled={!place.apiBacked} onPress={() => setAdding(true)}><Button.Label>{t("detailGuide.addToTrip")}</Button.Label></Button>
        <Button variant="secondary" isDisabled={!place.apiBacked} onPress={() => router.push({ pathname: "/booking/new", params: { destinationId: place.id } })}><Button.Label>{t("travel.detail.checkout")}</Button.Label></Button>
      </View>
      {adding && <AddDestinationToTrip destinationId={place.id} onClose={() => setAdding(false)} />}
    </>}
  </View>;
}

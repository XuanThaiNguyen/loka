import { LoadingAnnouncement, LoadingSkeleton, QueryFeedback, type FeedbackQuery } from "@/components/ui/loading-skeleton";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRecentTravelers, type RecentTraveler } from "@/features/discovery/services/discovery-api-service";
import { SearchDestinationCard } from "@/features/search/components/search-destination-card";
import { matchesSearch, type SearchScope } from "@/features/search/search-utils";
import { useCitySearch, useDestinationSearch } from "@/features/search/services/search-api-service";
import { mapDestination, type CityDTO } from "@/features/travel/services/travel-api-service";
import { type Destination } from "@/features/travel/travel.data";
import { theme } from "@/theme/theme";

type Person = RecentTraveler;
type SearchRow =
  | { kind: "heading"; id: string; title: string }
  | { kind: "place"; id: string; place: Destination }
  | { kind: "city"; id: string; city: CityDTO }
  | { kind: "person"; id: string; person: Person }
  | { kind: "status"; id: string; query?: FeedbackQuery; hasData?: boolean; empty: boolean; debouncing?: boolean }
  | { kind: "more"; id: string }
  | { kind: "note"; id: string; text: string };
const scopes: SearchScope[] = ["all", "places", "cities", "people"];

export function SearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const params = useLocalSearchParams<{ scope?: string }>();
  const [scope, setScope] = useState<SearchScope>(scopes.includes(params.scope as SearchScope) ? params.scope as SearchScope : "all");
  const list = useRef<FlatList<SearchRow>>(null);
  const input = useRef<TextInput>(null);
  const query = text.trim();
  const debouncing = query !== search;
  const showPlaces = scope === "all" || scope === "places";
  const showCities = scope === "all" || scope === "cities";
  const showPeople = scope === "all" || scope === "people";
  const placesQuery = useDestinationSearch(search, showPlaces && !debouncing);
  const citiesQuery = useCitySearch(search, showCities && !debouncing);
  const peopleQuery = useRecentTravelers(showPeople);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const places = showPlaces && !debouncing ? placesQuery.data?.pages.flatMap((page) => page.data.map(mapDestination)) ?? [] : [];
  const cities = showCities && !debouncing ? citiesQuery.data ?? [] : [];
  const people = showPeople ? peopleQuery.cards.filter((person) => matchesSearch(query, [person.traveler.displayName, person.recentTrip.city?.name ?? "", person.recentTrip.city?.country ?? ""])) : [];
  const loading = (showPeople && peopleQuery.isPending && peopleQuery.fetchStatus === "fetching") || (showPlaces && (debouncing || (placesQuery.isPending && placesQuery.fetchStatus === "fetching"))) || (showCities && (debouncing || (citiesQuery.isPending && citiesQuery.fetchStatus === "fetching")));
  const failed = (showPeople && (peopleQuery.isError || peopleQuery.fetchStatus === "paused")) || (showPlaces && (placesQuery.isError || placesQuery.fetchStatus === "paused")) || (showCities && (citiesQuery.isError || citiesQuery.fetchStatus === "paused"));
  const count = places.length + cities.length + people.length;
  const moreAvailable = (showPlaces && placesQuery.hasNextPage) || (showCities && cities.length === 50);
  const popularTerms = cities.length ? cities.slice(0, 6).map((city) => city.name) : [];
  const rows: SearchRow[] = [];

  if (showPlaces) {
    rows.push({ kind: "heading", id: "places-heading", title: t(query ? "searchScreen.places" : "searchScreen.popularPlaces") });
    rows.push(...places.map((place): SearchRow => ({ kind: "place", id: `place-${place.id}`, place })));
    rows.push({ kind: "status", id: "places-status", query: placesQuery, hasData: placesQuery.data !== undefined, empty: !places.length, debouncing });
    if (!debouncing && placesQuery.hasNextPage) rows.push({ kind: "more", id: "more-places" });
  }
  if (showCities) {
    rows.push({ kind: "heading", id: "cities-heading", title: t(query ? "searchScreen.cities" : "searchScreen.popularCities") });
    rows.push(...cities.map((city): SearchRow => ({ kind: "city", id: `city-${city.id}`, city })));
    rows.push({ kind: "status", id: "cities-status", query: citiesQuery, hasData: citiesQuery.data !== undefined, empty: !cities.length, debouncing });
  }
  if (showPeople) {
    rows.push({ kind: "heading", id: "people-heading", title: t("searchScreen.people") });
    rows.push({ kind: "note", id: "people-note", text: t("discovery.peopleHint") });
    rows.push(...people.map((person): SearchRow => ({ kind: "person", id: `person-${person.traveler.accountId}`, person })));
    rows.push({ kind: "status", id: "people-status", query: peopleQuery, hasData: peopleQuery.data !== undefined, empty: !people.length });
  }

  const updateText = (value: string) => {
    setText(value);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  };
  const openPlace = (id: string) => { Keyboard.dismiss(); router.push({ pathname: "/destination/[id]", params: { id } }); };

  return <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
    <LoadingAnnouncement loading={loading} />
    <View style={styles.searchRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={styles.back}>
        <Ionicons name="arrow-back" size={23} color={c.foreground} />
      </Pressable>
      <View style={styles.searchPill}>
        <Ionicons name="search-outline" size={22} color={c.foreground} />
        <TextInput ref={input} value={text} onChangeText={updateText} accessibilityLabel={t("searchScreen.title")} placeholder={t("searchScreen.placeholder")} placeholderTextColor={c.muted} style={styles.input} autoCorrect={false} autoCapitalize="none" returnKeyType="search" maxLength={100} onSubmitEditing={() => { setSearch(query); Keyboard.dismiss(); }} />
        {text ? <Pressable accessibilityRole="button" accessibilityLabel={t("common.clear")} onPress={() => { updateText(""); setSearch(""); input.current?.focus(); }} style={styles.clear}><Ionicons name="close-circle" size={20} color={c.muted} /></Pressable> : null}
      </View>
    </View>
    <View accessibilityRole="tablist" style={styles.filters}>
      {scopes.map((value) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: scope === value }} onPress={() => { setScope(value); list.current?.scrollToOffset({ offset: 0, animated: false }); }} style={[styles.chip, scope === value && styles.activeChip]}><Text style={[styles.chipText, scope === value && styles.activeChipText]}>{t(`searchScreen.${value}`)}</Text></Pressable>)}
    </View>
    <FlatList
      ref={list}
      data={rows}
      keyExtractor={(row) => row.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      ListHeaderComponent={<View style={styles.listHeader}>
        {!query && scope !== "people" ? <View style={styles.suggestions}>
          <Text style={styles.sectionTitle}>{t("searchScreen.popularSearches")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.terms}>
            {[...new Set(popularTerms)].map((term) => <Pressable key={term} accessibilityRole="button" onPress={() => { updateText(term); setSearch(term); }} style={styles.term}><Ionicons name="trending-up" size={14} color={c.muted} /><Text style={styles.termLabel}>{term}</Text></Pressable>)}
          </ScrollView>
        </View> : null}
        {query ? <Text style={styles.resultCount}>{loading ? t("searchScreen.searching") : t("searchScreen.results", { count, suffix: moreAvailable ? "+" : "" })}</Text> : null}
        {query && !loading && !failed && count === 0 ? <Text style={styles.emptyHint}>{t("searchScreen.tryAnother")}</Text> : null}
      </View>}
      renderItem={({ item }) => {
        switch (item.kind) {
          case "heading": return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{item.title}</Text></View>;
          case "note": return <Text style={styles.emptyHint}>{item.text}</Text>;
          case "place": return <SearchDestinationCard destination={item.place} onPress={() => openPlace(item.place.id)} />;
          case "city": return <Pressable accessibilityRole="button" accessibilityLabel={item.city.name} onPress={() => { Keyboard.dismiss(); router.push({ pathname: "/city/[id]", params: { id: item.city.id } }); }} style={styles.cityCard}>
            <Image source={{ uri: item.city.coverImageUrl }} style={styles.cityImage} contentFit="cover" />
            <View style={styles.cardText}><Text style={styles.cardTitle}>{item.city.name}</Text><Text style={styles.cardSubtitle}>{item.city.country}</Text></View>
            <Ionicons name="arrow-up-right-box-outline" size={20} color={c.muted} />
          </Pressable>;
          case "person": return <Pressable accessibilityRole="button" accessibilityLabel={t("home.viewTraveler", { name: item.person.traveler.displayName })} onPress={() => { Keyboard.dismiss(); router.push({ pathname: "/traveler/[id]", params: { id: item.person.traveler.accountId } }); }} style={styles.personCard}>
            <Image source={{ uri: item.person.traveler.avatarUrl ?? undefined }} style={[styles.avatar, { backgroundColor: c.surfaceSecondary }]} contentFit="cover" />
            <View style={styles.cardText}><Text style={styles.cardTitle}>{item.person.traveler.displayName}</Text><Text style={styles.cardSubtitle}>{item.person.recentTrip.city?.name ?? t("discovery.recentTrip")}</Text></View>
            <View style={styles.viewProfile}><Text style={styles.viewProfileText}>{t("home.viewProfile")}</Text></View>
          </Pressable>;
          case "more": return <Pressable accessibilityRole="button" disabled={placesQuery.isFetchingNextPage} onPress={() => void placesQuery.fetchNextPage()} style={styles.loadMore}>{placesQuery.isFetchingNextPage ? <Text style={styles.actionText}>{t("loadingUi.content")}</Text> : <Text style={styles.actionText}>{t("searchScreen.loadMore")}</Text>}</Pressable>;
          case "status": return <View style={styles.status}>
            {item.debouncing ? <LoadingSkeleton layout="list" announce={false} /> : item.query ? <QueryFeedback query={item.query} hasData={item.hasData} layout="list" announce={false} /> : null}
            {item.empty && !item.debouncing && !item.query?.isPending && !item.query?.isError && item.query?.fetchStatus !== "paused" ? <Text style={styles.emptyHint}>{t("searchScreen.empty")}</Text> : null}
          </View>;
        }
      }}
    />
  </View>;
}

const c = theme.colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  searchRow: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 6 },
  back: { width: 36, height: 48, alignItems: "center", justifyContent: "center" },
  searchPill: { flex: 1, flexDirection: "row", alignItems: "center", minHeight: 54, paddingLeft: 15, paddingRight: 7, gap: 9, borderRadius: 28, borderWidth: 1, borderColor: c.separator, backgroundColor: c.surface },
  input: { flex: 1, minWidth: 0, paddingVertical: 14, color: c.foreground, fontSize: 15, lineHeight: 22 },
  clear: { width: 40, height: 44, alignItems: "center", justifyContent: "center" },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  chip: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.separator, justifyContent: "center" },
  activeChip: { backgroundColor: c.foreground, borderColor: c.foreground },
  chipText: { color: c.muted, fontSize: 13, lineHeight: 19 },
  activeChipText: { color: c.surface, fontWeight: "600" },
  content: { paddingHorizontal: 20, gap: 14 },
  listHeader: { gap: 10 },
  suggestions: { gap: 12, paddingTop: 14 },
  terms: { gap: 8 },
  term: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 42, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: c.separator, backgroundColor: c.surface },
  termLabel: { fontSize: 13, color: c.muted },
  resultCount: { color: c.foreground, fontSize: 18, lineHeight: 26, fontWeight: "600", marginTop: 12 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 6 },
  sectionTitle: { color: c.foreground, fontSize: 17, lineHeight: 24, fontWeight: "600" },
  cityCard: { flexDirection: "row", alignItems: "center", padding: 10, gap: 14, borderRadius: 18, borderWidth: 1, borderColor: c.separator, backgroundColor: c.surface },
  cityImage: { width: 88, height: 92, borderRadius: 12, backgroundColor: c.surfaceSecondary },
  personCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: c.separator, backgroundColor: c.surface },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  cardText: { flex: 1, gap: 6 },
  cardTitle: { color: c.foreground, fontSize: 15, lineHeight: 21, fontWeight: "600" },
  cardSubtitle: { color: c.muted, fontSize: 12, lineHeight: 18 },
  viewProfile: { backgroundColor: c.foreground, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 20 },
  viewProfileText: { color: c.surface, fontSize: 11, lineHeight: 16 },
  status: { paddingVertical: 20, alignItems: "center", gap: 8 },
  emptyHint: { color: c.muted, fontSize: 13, lineHeight: 20 },
  loadMore: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 44, borderRadius: 22, backgroundColor: c.surfaceSecondary, alignItems: "center" },
  actionText: { color: c.foreground, fontSize: 13, lineHeight: 20, fontWeight: "500" },
});

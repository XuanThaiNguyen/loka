import { Button } from "heroui-native";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";

import { guideWash, supportedGuideSections, type CityGuide, type CityGuideItem, type CityGuideSection, type ContentTarget } from "@/features/travel/city-guide";
import { CityExpandableText } from "./city-editorial-sections";
import { detailStyles as s } from "./detail-ui";
import { CatalogImage } from "./catalog-image";
import { theme } from "@/theme/theme";

const c = theme.colors.light;
const ratios = { tall: 3 / 4, portrait: 5 / 6, square: 1, landscape: 4 / 3 };

/** Native horizontal section picker instead of the web's sticky anchor navigation. */
export function CityGuideSections({ guide, cityId }: { guide: CityGuide; cityId?: string }) {
  const { t } = useTranslation();
  const sections = supportedGuideSections(guide);
  const [selected, setSelected] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const select = (id: string) => { setSelected(id); setVisited((previous) => new Set([...previous, id, sections[0]?.id].filter(Boolean))); };
  const section = sections.find((item) => item.id === selected) ?? sections[0];
  if (!section) return null;
  return <View style={{ gap: 20 }}>
    <Text style={s.heading}>{t("cityGuide.title")}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {sections.map((item) => <Button key={item.id} size="sm" variant={item.id === section.id ? "primary" : "secondary"} accessibilityState={{ selected: item.id === section.id }} onPress={() => select(item.id)}><Button.Label>{item.navLabel ?? item.title}</Button.Label></Button>)}
    </ScrollView>
    {sections.filter((item) => item.id === section.id || visited.has(item.id)).map((item) => <View key={item.id} style={{ display: item.id === section.id ? "flex" : "none" }} accessibilityElementsHidden={item.id !== section.id} importantForAccessibility={item.id === section.id ? "auto" : "no-hide-descendants"}><GuideSection section={item} cityId={cityId} /></View>)}
    {sections.length > 1 ? <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Text style={s.body}>{sections.indexOf(section) + 1} / {sections.length}</Text>
      <Button variant="ghost" size="sm" onPress={() => select(sections[(sections.indexOf(section) + 1) % sections.length].id)}><Button.Label>{t("detailGuide.next")}</Button.Label></Button>
    </View> : null}
  </View>;
}

function GuideSection({ section, cityId }: { section: CityGuideSection; cityId?: string }) {
  const { t } = useTranslation();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 360 || fontScale > 1.3 ? 1 : 2;
  const snippets = section.snippets ?? [];
  const items = section.items ?? [];
  const compact = section.layout === "snippets" || section.layout === "highlights";
  return <View style={{ gap: 16 }}>
    {section.eyebrow ? <Text style={{ color: c.muted, fontSize: 11, letterSpacing: 1.4, fontWeight: "700" }}>{section.eyebrow}</Text> : null}
    <Text selectable style={[s.heading, { fontSize: 25, lineHeight: 32 }]}>{section.title}</Text>
    {snippets.map((text, index) => <View key={`${index}-${text}`} style={compact ? { padding: 20, borderRadius: 24, ...guideWash(index % 2 ? "lilac" : "coral") } : undefined}><CityExpandableText text={text} /></View>)}
    {section.layout === "cta" && (section.target || cityId) ? <Button onPress={() => openTarget(section.target ?? { kind: "trip", cityId: cityId! })}><Button.Label>{section.actionLabel ?? t("trips.createTrip")}</Button.Label></Button> : null}
    {section.layout === "rail" ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>{items.map((item) => <View key={item.id} style={{ width: Math.min(width - 64, 280) }}><GuideItem item={item} layout={section.layout} /></View>)}</ScrollView> : null}
    {section.layout === "masonry" ? <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>{Array.from({ length: columns }, (_, column) => <View key={column} style={{ flex: 1, gap: 16, paddingTop: column ? 20 : 0 }}>{items.filter((_, index) => index % columns === column).map((item) => <GuideItem key={item.id} item={item} layout={section.layout} />)}</View>)}</View> : null}
    {["badges", "checklist", "info", "snippets", "highlights", "cta"].includes(section.layout) ? items.map((item) => <GuideItem key={item.id} item={item} layout={section.layout} />) : null}
  </View>;
}

function GuideItem({ item, layout }: { item: CityGuideItem; layout: CityGuideSection["layout"] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const artwork = Boolean(item.imageUrl) && (layout === "masonry" || layout === "rail");
  return <View style={{ overflow: "hidden", borderRadius: 24, borderCurve: "continuous", backgroundColor: c.surface, borderWidth: 1, borderColor: c.separator }}>
    {artwork ? <CatalogImage source={{ uri: item.imageUrl! }} fallbackHeight={64} style={{ width: "100%", aspectRatio: layout === "rail" ? 1.7 : ratios[item.ratio ?? "landscape"] }} contentFit="cover" /> : null}
    <View style={{ padding: 18, gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        {!artwork && item.emoji ? <View style={{ padding: 10, borderRadius: 16, ...guideWash(item.accent) }}><Text accessibilityElementsHidden style={{ fontSize: 22 }}>{item.emoji}</Text></View> : null}
        <Text selectable style={[s.label, { flex: 1 }]}>{item.title}</Text>
      </View>
      {item.stat ? <Text selectable style={{ fontSize: 24, color: c.accent, fontWeight: "800" }}>{item.stat}</Text> : null}
      {item.description ? <CityExpandableText text={item.description} /> : null}
      {item.highlight ? <Text selectable style={[s.actionText, { lineHeight: 20 }]}>{item.highlight}</Text> : null}
      {((item.points?.length ?? 0) > 0 || item.note) ? <>
        <Button size="sm" variant="secondary" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}><Button.Label>{t(expanded ? "cityEditorial.less" : "cityEditorial.more")}</Button.Label></Button>
        {expanded ? <>{(item.points ?? []).map((point, index) => <Text selectable key={index} style={s.body}>• {point}</Text>)}{item.note ? <Text selectable style={s.body}>{item.note}</Text> : null}</> : null}
      </> : null}
      {item.target ? <Button size="sm" variant="secondary" onPress={() => openTarget(item.target!)}><Button.Label>{item.navLabel ?? item.title}</Button.Label></Button> : null}
    </View>
  </View>;
}

function openTarget(target: ContentTarget) {
  if (target.kind === "trip") router.push({ pathname: "/trip/new", params: { cityId: target.cityId } });
  else if (target.kind === "city") router.push({ pathname: "/city/[id]", params: { id: target.id } });
  else router.push({ pathname: "/destination/[id]", params: { id: target.id } });
}

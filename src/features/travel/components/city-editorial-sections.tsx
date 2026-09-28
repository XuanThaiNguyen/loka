import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

import type { CityEditorial } from "@/features/travel/city-editorial";
import { DetailSection, detailStyles as s } from "@/features/travel/components/detail-ui";
import { theme } from "@/theme/theme";

const colors = theme.colors.light;

export function CityExpandableText({ text }: { text: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  return <View style={{ gap: 4 }}>
    {/* Measure the complete text independently of its collapsed rendering. */}
    <Text style={[s.body, { position: "absolute", left: 0, right: 0, opacity: 0, pointerEvents: "none" }]} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onTextLayout={(event) => setCanExpand(event.nativeEvent.lines.length > 3)}>{text}</Text>
    <Text selectable style={s.body} numberOfLines={expanded ? undefined : 3}>{text}</Text>
    {canExpand ? <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}><Text style={s.actionText}>{t(expanded ? "cityEditorial.less" : "cityEditorial.more")}</Text></Pressable> : null}
  </View>;
}

export function CityStory({ editorial }: { editorial: CityEditorial }) {
  const { t } = useTranslation();
  return <View style={{ padding: 24, gap: 18, borderRadius: 30, borderCurve: "continuous", backgroundColor: colors.accentSoft, experimental_backgroundImage: "linear-gradient(135deg, #eaf0ff 0%, #f2ecff 60%, #fff5eb 100%)" }}>
    <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 }}>{t("cityEditorial.eyebrow")}</Text>
    <Text selectable style={{ color: colors.foreground, fontSize: 25, lineHeight: 32, fontWeight: "700" }}>{editorial.headline}</Text>
    <CityExpandableText text={editorial.intro} />
    <View style={s.wrap}>{editorial.moods.map((mood) => <Text key={mood} style={{ color: colors.accent, fontSize: 12, fontWeight: "600", paddingVertical: 7, paddingHorizontal: 11, borderRadius: 20, backgroundColor: colors.surface }}>{mood}</Text>)}</View>
    {editorial.preview ? <Text style={{ fontSize: 11, lineHeight: 16, color: colors.muted }}>{t("cityEditorial.preview")}</Text> : null}
  </View>;
}

export function CityExperiences({ editorial }: { editorial: CityEditorial }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  if (!editorial.experiences.length) return null;
  return <DetailSection title={t("cityEditorial.experiences")}>
    <Text style={s.body}>{t("cityEditorial.experiencesHint")}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
      {editorial.experiences.map((item, index) => <View key={item.title} style={{ width: Math.min(260, width * 0.72), padding: 24, gap: 18, marginTop: index % 2 ? 18 : 0, backgroundColor: ["#eef2ff", "#eaf5ef", "#fff1e5", "#f4edfa"][index % 4], borderRadius: 28, borderCurve: "continuous" }}>
        <Text style={{ color: colors.accent, fontSize: 42, lineHeight: 50, fontWeight: "300", fontVariant: ["tabular-nums"] }}>{String(index + 1).padStart(2, "0")}</Text>
        <Text selectable style={s.label}>{item.title}</Text>
        <Text selectable style={s.body}>{item.description}</Text>
      </View>)}
    </ScrollView>
  </DetailSection>;
}

export function CityAreas({ editorial }: { editorial: CityEditorial }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);
  const area = editorial.areas[selected] ?? editorial.areas[0];
  if (!area) return null;
  return <DetailSection title={t("cityEditorial.areas")}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {editorial.areas.map((item, index) => <Pressable key={item.title} accessibilityRole="tab" accessibilityState={{ selected: index === selected }} onPress={() => setSelected(index)} style={{ minHeight: 44, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 22, backgroundColor: index === selected ? colors.accent : colors.surface, borderWidth: 1, borderColor: index === selected ? colors.accent : colors.border }}><Text style={{ color: index === selected ? colors.accentForeground : colors.foreground, fontWeight: "600" }}>{item.title}</Text></Pressable>)}
    </ScrollView>
    <View style={{ padding: 24, gap: 14, borderRadius: 28, backgroundColor: colors.surface, experimental_backgroundImage: "linear-gradient(135deg, #eef4ff 0%, #ffffff 100%)" }}>
      <Text selectable style={s.actionText}>{area.audience}</Text>
      <Text selectable style={s.body}>{area.description}</Text>
    </View>
  </DetailSection>;
}

export function CityFood({ editorial }: { editorial: CityEditorial }) {
  const { t } = useTranslation();
  if (!editorial.food.length) return null;
  return <DetailSection title={t("cityEditorial.food")}>
    <Text style={s.body}>{t("cityEditorial.foodHint")}</Text>
    <View style={{ borderRadius: 24, paddingHorizontal: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.separator }}>
      {editorial.food.map((item, index) => <View key={item.title} style={{ paddingVertical: 18, gap: 6, borderTopWidth: index ? 1 : 0, borderTopColor: colors.separator }}><Text selectable style={s.label}>{item.title}</Text><Text selectable style={s.body}>{item.description}</Text></View>)}
    </View>
  </DetailSection>;
}

export function CityPractical({ editorial }: { editorial: CityEditorial }) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState<string | null>(null);
  if (!editorial.practical.length) return null;
  return <DetailSection title={t("cityEditorial.practical")}>
    <View style={{ borderRadius: 24, paddingHorizontal: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.separator }}>
      {editorial.practical.map((item, index) => <View key={item.title} style={{ borderTopWidth: index ? 1 : 0, borderTopColor: colors.separator }}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: opened === item.title }} onPress={() => setOpened(opened === item.title ? null : item.title)} style={{ minHeight: 64, paddingVertical: 16, flexDirection: "row", gap: 16, alignItems: "center" }}><Text style={[s.label, { flex: 1 }]}>{item.title}</Text><Text style={{ color: colors.accent, fontSize: 24 }} accessibilityElementsHidden importantForAccessibility="no">{opened === item.title ? "−" : "+"}</Text></Pressable>
        {opened === item.title ? <Text selectable style={[s.body, { paddingBottom: 20 }]}>{item.description}</Text> : null}
      </View>)}
    </View>
  </DetailSection>;
}

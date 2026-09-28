import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { useVisitProfile } from "@/features/travel/services/visit-profile-service";
import { DetailAction, DetailState, detailStyles as s } from "./detail-ui";

export function VisitProfileCard({ id }: { id: string }) {
  const { t, i18n } = useTranslation();
  const query = useVisitProfile(id, true);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  if (query.isPending) return <DetailState loading />;
  if (query.isError) return <DetailState onRetry={() => void query.refetch()} />;
  const profile = query.data;
  if (!profile) return null;
  const date = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(i18n.language).format(new Date(value)) : null;
  const expired = profile.validUntil !== null && Date.parse(profile.validUntil) <= now;
  const duration = profile.minimumVisitMinutes != null && profile.maximumVisitMinutes != null
    ? t("visitKnowledge.minutes", { value: profile.minimumVisitMinutes === profile.maximumVisitMinutes ? String(profile.minimumVisitMinutes) : `${profile.minimumVisitMinutes}–${profile.maximumVisitMinutes}` })
    : t("visitKnowledge.unknown");
  const facts = [
    [t("detailGuide.visitDuration"), duration],
    [t("detailGuide.accessibility"), t(`visitKnowledge.access.${profile.wheelchairAccess}`)],
    [t("visitKnowledge.exposure"), t(`visitKnowledge.weather.${profile.weatherExposure}`)],
    [t("detailGuide.bookingAdvice"), t(`visitKnowledge.booking.${profile.bookingPolicy}`)],
    ...(profile.advanceBookingMinutes !== null ? [[t("visitKnowledge.advance"), t("visitKnowledge.minutes", { value: profile.advanceBookingMinutes })]] : []),
    [t("visitKnowledge.timezone"), profile.timezone],
    [t("visitKnowledge.schedule"), t(`visitKnowledge.coverage.${profile.scheduleCoverage}`)],
  ];
  let sourceUrl: string | null = null;
  try {
    const url = new URL(profile.sourceUrl ?? "");
    if (url.protocol === "https:" || url.protocol === "http:") sourceUrl = url.href;
  } catch { /* Invalid evidence links are not actionable. */ }
  return <View style={s.card}>
    <Text style={s.heading}>{t("visitKnowledge.title")}</Text>
    <Text style={s.label}>{t(expired ? "visitKnowledge.expired" : profile.verificationStatus === "verified" ? "visitKnowledge.verified" : "visitKnowledge.unverified")}</Text>
    {facts.map(([label, value]) => <View key={label} style={{ gap: 2 }}><Text style={s.label}>{label}</Text><Text selectable style={s.body}>{value}</Text></View>)}
    {profile.travelAdvice ? <Text selectable style={s.body}>{profile.travelAdvice}</Text> : null}
    {profile.sourceName ? <Text selectable style={s.body}>{t("visitKnowledge.source")}: {profile.sourceName}</Text> : null}
    {([["observed", profile.observedAt], ["verifiedDate", profile.verifiedAt], ["validUntil", profile.validUntil]] as const).map(([label, value]) => date(value) ? <Text key={label} style={s.body}>{t(`visitKnowledge.${label}`)}: {date(value)}</Text> : null)}
    {sourceUrl ? <DetailAction label={t("visitKnowledge.viewSource")} icon="open-outline" onPress={() => void Linking.openURL(sourceUrl!).catch(() => Alert.alert(t("visitKnowledge.linkError")))} /> : null}
    <Text style={s.body}>{t("visitKnowledge.hint")}</Text>
  </View>;
}

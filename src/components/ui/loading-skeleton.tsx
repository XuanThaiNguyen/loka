import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme/theme";

export type SkeletonLayout = "detail" | "list" | "cities" | "destinations" | "grid" | "form" | "card";

const LoadingContext = createContext<((id: string, loading: boolean) => void) | null>(null);

/** Coalesce independently loading child panels into one screen-reader announcement. */
export function LoadingScope({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  const update = useCallback((id: string, loading: boolean) => {
    setPending((current) => {
      if (current.has(id) === loading) return current;
      const next = new Set(current);
      if (loading) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  return <LoadingContext.Provider value={update}>
    <Announcement loading={pending.size > 0} />
    {children}
  </LoadingContext.Provider>;
}

export function LoadingAnnouncement({ loading }: { loading: boolean }) {
  const update = useContext(LoadingContext);
  const id = useId();
  useEffect(() => {
    update?.(id, loading);
    return () => update?.(id, false);
  }, [id, loading, update]);
  return update ? null : <Announcement loading={loading} />;
}

/** One announcement per loading cycle. Decorative placeholders never enter the accessibility tree. */
function Announcement({ loading }: { loading: boolean }) {
  const { t } = useTranslation();
  const label = t("loadingUi.content");
  useEffect(() => {
    if (loading && Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(label);
  }, [loading, label]);
  return loading ? <Text accessibilityRole="progressbar" accessibilityLiveRegion="polite" style={s.srOnly}>{label}</Text> : null;
}

// Static placeholders deliberately avoid shimmer/pulsing and respect reduced motion by default.
export function LoadingSkeleton({ layout = "list", announce = true }: { layout?: SkeletonLayout; announce?: boolean }) {
  const line = <><View style={[s.block, s.title]} /><View style={[s.block, s.line]} /><View style={[s.block, s.short]} /></>;
  return <View style={s.container}>
    {announce ? <LoadingAnnouncement loading /> : null}
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.container}>
      {layout === "detail" ? <><View style={[s.block, s.hero]} />{line}<View style={[s.block, s.chip]} /><View style={[s.block, s.paragraph]} />{line}</>
      : layout === "cities" || layout === "destinations" ? <View style={s.rail}>{[0, 1, 2].map((id) => <View key={id} style={{ width: layout === "cities" ? 126 : 220, gap: 10 }}><View style={[s.block, { height: layout === "cities" ? 166 : 210 }]} />{line}</View>)}</View>
      : layout === "grid" ? <View style={s.grid}>{[0, 1, 2, 3, 4, 5].map((id) => <View key={id} style={[s.block, s.tile]} />)}</View>
      : layout === "form" ? <>{[0, 1, 2, 3].map((id) => <View key={id} style={s.container}><View style={[s.block, s.short]} /><View style={[s.block, s.field]} /></View>)}</>
      : layout === "card" ? <View style={[s.block, s.paragraph]} />
      : [0, 1, 2].map((id) => <View key={id} style={s.row}><View style={[s.block, s.thumb]} /><View style={s.text}>{line}</View></View>)}
    </View>
  </View>;
}

export type FeedbackQuery = { isPending?: boolean; isFetching?: boolean; isError?: boolean; fetchStatus?: string; error?: unknown; refetch: () => unknown };
export function QueryFeedback({ query, hasData = false, layout = "list", announce = true }: { query: FeedbackQuery; hasData?: boolean; layout?: SkeletonLayout; announce?: boolean }) {
  const { t } = useTranslation();
  const errorCode = (query.error as { code?: string } | null)?.code;
  const offline = query.fetchStatus === "paused" || errorCode === "NETWORK_ERROR";
  const inactive = query.isPending && query.fetchStatus === "idle";
  if (offline || query.isError || inactive) return <View style={s.feedback}>
    <Text accessibilityRole="alert" style={s.caption}>{t(offline ? "loadingUi.offline" : errorCode === "REQUEST_TIMEOUT" ? "loadingUi.timeout" : "detailGuide.loadError")}</Text>
    <Pressable accessibilityRole="button" onPress={() => void query.refetch()} style={s.retry}><Text style={s.retryText}>{t("common.retry")}</Text></Pressable>
  </View>;
  if (!hasData && (query.isPending || query.isFetching)) return <LoadingSkeleton layout={layout} announce={announce} />;
  if (hasData && query.isFetching) return <Text style={s.caption}>{t("loadingUi.refreshing")}</Text>;
  return null;
}
const s = StyleSheet.create({
  container: { gap: 14, overflow: "hidden" }, block: { borderRadius: 15, backgroundColor: theme.colors.light.surfaceSecondary },
  hero: { width: "100%", aspectRatio: 1.78, borderRadius: 20 }, title: { width: "75%", height: 26 }, line: { height: 16, width: "100%" }, short: { height: 16, width: "55%" },
  chip: { height: 44, width: 140, borderRadius: 22 }, paragraph: { height: 160 }, field: { height: 54 }, rail: { flexDirection: "row", gap: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, tile: { width: "30%", aspectRatio: 0.8 }, row: { flexDirection: "row", gap: 14 }, thumb: { width: 110, height: 136 }, text: { flex: 1, gap: 12, justifyContent: "center" },
  feedback: { padding: 14, gap: 8, borderRadius: 16, backgroundColor: theme.colors.light.surfaceSecondary }, caption: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18 },
  retry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }, retryText: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  srOnly: { position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0.01 },
});

import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { QueryFeedback, type FeedbackQuery, type SkeletonLayout } from "@/components/ui/loading-skeleton";
import { theme, travelSurfaces } from "@/theme/theme";

/** Home sections can depend on several requests without hiding already loaded cards. */
export function HomeSectionState({ queries, hasData, empty, emptyLabel, layout = "card" }: {
  queries: readonly FeedbackQuery[];
  hasData: boolean;
  empty?: boolean;
  emptyLabel?: string;
  layout?: SkeletonLayout;
}) {
  const { t } = useTranslation();
  const failed = queries.find((query) => query.isError || query.fetchStatus === "paused"
    || (query.isPending && query.fetchStatus === "idle"));
  const pending = queries.some((query) => query.isPending);
  const fetching = queries.some((query) => query.isFetching);
  const query: FeedbackQuery = {
    ...(failed ?? { isPending: pending, isFetching: fetching, fetchStatus: fetching ? "fetching" : "idle" }),
    refetch: () => Promise.all(queries.map((item) => item.refetch())),
  };
  return <>
    <QueryFeedback query={query} hasData={hasData} layout={layout} announce={false} />
    {empty && !pending && !failed ? <View style={styles.empty}>
      <Text style={styles.text}>{emptyLabel ?? t("catalogContent.empty")}</Text>
    </View> : null}
  </>;
}

const styles = StyleSheet.create({
  empty: { padding: 14, borderRadius: 16, backgroundColor: travelSurfaces.info },
  text: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18 },
});

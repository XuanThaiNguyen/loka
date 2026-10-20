import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { QueryFeedback, type FeedbackQuery } from "@/components/ui/loading-skeleton";
import { theme } from "@/theme/theme";

export function DiscoveryState({ query, empty, emptyKey = "discovery.empty" }: {
  query: FeedbackQuery & { data?: unknown };
  empty: boolean;
  emptyKey?: string;
}) {
  const { t } = useTranslation();
  return <View style={styles.state}>
    <QueryFeedback query={query} hasData={query.data !== undefined} layout="list" />
    {empty && query.data !== undefined && !query.isPending && !query.isError && query.fetchStatus !== "paused" ?
      <Text style={styles.caption}>{t(emptyKey)}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  state: { paddingHorizontal: 20, gap: 10 },
  caption: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18 },
});

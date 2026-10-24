import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/auth-provider";
import { SignInScreen } from "@/features/auth/screens/sign-in-screen";
import { tripsApi } from "@/features/trips/services/trips-api-service";
import { theme } from "@/theme/theme";

export function InvitationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const valid =
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { session } = useAuth();
  const focused = useIsFocused();
  const { t } = useTranslation();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const query = useQuery({
    queryKey: ["trips", "invitation-review", session?.user.id, id],
    enabled: valid && Boolean(session) && focused,
    queryFn: ({ signal }) => tripsApi.getInvitation(id, signal),
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30000,
    retry: false,
  });
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  if (!session && valid) return <SignInScreen returnTo={`/invitation/${id}`} />;
  const invitation = !query.isError ? query.data?.data : undefined;
  const respond = async (action: "accept" | "decline") => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await tripsApi.respondToInvitation(id, action);
      await client.invalidateQueries({ queryKey: ["trips"] });
    } catch {
      setError(true);
      await query.refetch();
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={back}>
          <Text>{t("invitationReview.back")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("invitationReview.title")}</Text>
        {valid && query.isPending && session ? (
          <ActivityIndicator accessibilityLabel={t("invitationReview.loading")} />
        ) : null}
        {!valid || query.isError ? (
          <View>
            <Text accessibilityRole="alert">{t("invitationReview.unavailable")}</Text>
            {valid ? (
              <Pressable accessibilityRole="button" onPress={() => void query.refetch()}>
                <Text>{t("invitationReview.retry")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {invitation ? (
          <>
            <Text style={styles.title}>{invitation.trip.name}</Text>
            <Text>{t("invitationReview.from", { name: invitation.invitedBy.name })}</Text>
            <Text>{t(`invitationReview.${invitation.status}`)}</Text>
            {invitation.status === "pending" ? (
              <>
                <Text>
                  {t("invitationReview.expires", {
                    date: new Date(invitation.expiresAt).toLocaleString(),
                  })}
                </Text>
                <Text>{t("invitationReview.access")}</Text>
                {(["accept", "decline"] as const).map((action) => (
                  <Pressable
                    key={action}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: busy }}
                    disabled={busy}
                    style={styles.button}
                    onPress={() => void respond(action)}
                  >
                    <Text>{t(`invitationReview.${action}`)}</Text>
                  </Pressable>
                ))}
              </>
            ) : null}
            {invitation.status === "accepted" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/trip/[id]",
                    params: { id: String(invitation.trip.id) },
                  })
                }
              >
                <Text>{t("invitationReview.openTrip")}</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert">{t("invitationReview.responseError")}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.light.background },
  content: { padding: 24, gap: 20 },
  title: { fontSize: 20, fontWeight: "600", color: theme.colors.light.gray[900] },
  button: {
    minHeight: 48,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.light.gray[300],
    borderRadius: 12,
    alignItems: "center",
  },
});

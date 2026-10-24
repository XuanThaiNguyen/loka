import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/auth-provider";
import { SignInScreen } from "@/features/auth/screens/sign-in-screen";
import { notificationQueryKey, useNotifications, type TripInvitationNotification } from "@/features/notifications/services/notifications-api-service";
import { tripsApi } from "@/features/trips/services/trips-api-service";
import type { DataEnvelope } from "@/lib/api/client";
import { theme } from "@/theme/theme";

type ResponseAction = "accept" | "decline";
type Confirmation = { action: ResponseAction; tripId: number };

export function NotificationsScreen() {
  const { session } = useAuth();
  if (!session) return <SignInScreen returnTo="/notifications" />;
  // Remount local feedback / in-flight UI when the signed-in account changes.
  return <NotificationInbox key={session.user.id} viewerId={session.user.id} />;
}

function NotificationInbox({ viewerId }: { viewerId: string }) {
  const { t, i18n } = useTranslation();
  const query = useNotifications();
  const client = useQueryClient();
  const lock = useRef(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [responseError, setResponseError] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const items = query.isError ? [] : query.data ?? [];
  const date = (value: string) => new Date(value).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" });
  const respond = useCallback(async (item: TripInvitationNotification, action: ResponseAction) => {
    if (lock.current) return;
    if (Date.parse(item.expiresAt) <= Date.now()) {
      setResponseError(true);
      void query.refetch();
      return;
    }
    lock.current = true;
    setBusyId(item.id);
    setResponseError(false);
    setConfirmation(null);
    try {
      await tripsApi.respondToInvitation(item.invitationId, action);
      await client.cancelQueries({ queryKey: notificationQueryKey(viewerId) });
      client.setQueryData<DataEnvelope<TripInvitationNotification[]>>(
        notificationQueryKey(viewerId),
        (previous) => previous ? { data: previous.data.filter((entry) => entry.id !== item.id) } : previous,
      );
      setConfirmation({ action, tripId: item.trip.id });
      await client.invalidateQueries({ queryKey: ["trips"] });
    } catch {
      setResponseError(true);
      // Reconcile revoked, expired, or already-answered invitations before allowing a retry.
      await query.refetch();
    } finally {
      lock.current = false;
      setBusyId(null);
    }
  }, [client, query, viewerId]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("invitationReview.back")} style={styles.back}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>{t("notifications.title")}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={query.isFetching && !query.isPending} onRefresh={() => void query.refetch()} tintColor={colors.accent} />}>
        <Text style={styles.subtitle}>{t("notifications.subtitle")}</Text>
        {confirmation ? (
          <View style={styles.feedback}>
            <Text accessibilityRole="alert" style={styles.body}>{t(confirmation.action === "accept" ? "notifications.accepted" : "notifications.rejected")}</Text>
            {confirmation.action === "accept" ? (
              <Pressable accessibilityRole="button" style={styles.textButton}
                onPress={() => router.push({ pathname: "/trip/[id]", params: { id: String(confirmation.tripId) } })}>
                <Text style={styles.link}>{t("invitationReview.openTrip")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {responseError ? <Text accessibilityRole="alert" style={styles.error}>{t("notifications.responseError")}</Text> : null}
        {query.isPending && query.fetchStatus === "fetching" ? <ActivityIndicator accessibilityLabel={t("notifications.loading")} color={colors.accent} style={styles.loader} /> : null}
        {query.isError || query.fetchStatus === "paused" ? (
          <View style={styles.state}>
            <Ionicons name="cloud-offline-outline" size={36} color={colors.gray[500]} />
            <Text accessibilityRole="alert" style={styles.stateText}>{t(query.fetchStatus === "paused" ? "loadingUi.offline" : "notifications.loadError")}</Text>
            <Pressable accessibilityRole="button" style={styles.textButton} onPress={() => void query.refetch()}>
              <Text style={styles.link}>{t("invitationReview.retry")}</Text>
            </Pressable>
          </View>
        ) : !query.isPending && items.length === 0 ? (
          <View style={styles.state}>
            <View style={styles.emptyIcon}><Ionicons name="notifications-outline" size={32} color={colors.accent} /></View>
            <Text style={styles.emptyTitle}>{t("notifications.emptyTitle")}</Text>
            <Text style={styles.stateText}>{t("notifications.emptyDescription")}</Text>
          </View>
        ) : null}
        {items.map((item) => {
          if (item.type !== "trip_invitation") return null;
          const expired = Date.parse(item.expiresAt) <= now;
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeading}>
                <View style={styles.inviteIcon}><Ionicons name="people-outline" size={22} color={colors.accent} /></View>
                <View style={styles.cardLabel}>
                  <Text style={styles.eyebrow}>{t("notifications.invitation")}</Text>
                  <Text style={styles.timestamp}>{date(item.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.inviter}>{t("notifications.from", { name: item.invitedBy.name })}</Text>
              <Text style={styles.tripName}>{item.trip.name}</Text>
              <Text style={styles.body}>{date(item.trip.startDate)} – {date(item.trip.endDate)}</Text>
              <Text style={styles.body}>{t("notifications.access")}</Text>
              <Text style={styles.timestamp}>{expired ? t("invitationReview.expired") : t("invitationReview.expires", { date: new Date(item.expiresAt).toLocaleString(i18n.language) })}</Text>
              {expired ? null : (
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" disabled={busyId !== null} accessibilityState={{ disabled: busyId !== null }}
                    style={[styles.action, styles.reject, busyId !== null && styles.disabled]} onPress={() => void respond(item, "decline")}>
                    <Text style={styles.rejectText}>{t("notifications.reject")}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={busyId !== null} accessibilityState={{ disabled: busyId !== null }}
                    style={[styles.action, styles.accept, busyId !== null && styles.disabled]} onPress={() => void respond(item, "accept")}>
                    <Text style={styles.acceptText}>{t("notifications.accept")}</Text>
                  </Pressable>
                </View>
              )}
              {busyId === item.id ? <ActivityIndicator accessibilityLabel={t("notifications.saving")} color={colors.accent} /> : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = theme.colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800", color: colors.gray[900], flexShrink: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 32, gap: 20, flexGrow: 1 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.gray[600] },
  loader: { padding: 40 },
  card: { borderRadius: 20, backgroundColor: colors.base.white, padding: 20, gap: 12, borderWidth: 1, borderColor: colors.gray[200] },
  cardHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardLabel: { flex: 1, gap: 3 },
  inviteIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.gray[100], alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 13, fontWeight: "700", color: colors.accent },
  timestamp: { fontSize: 12, lineHeight: 18, color: colors.gray[600] },
  inviter: { fontSize: 15, lineHeight: 22, color: colors.gray[700] },
  tripName: { fontSize: 22, lineHeight: 28, fontWeight: "700", color: colors.gray[900] },
  body: { fontSize: 14, lineHeight: 22, color: colors.gray[700] },
  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
  action: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12 },
  accept: { backgroundColor: colors.accent },
  reject: { borderWidth: 1, borderColor: colors.gray[300] },
  acceptText: { color: colors.base.white, fontSize: 15, fontWeight: "700" },
  rejectText: { color: colors.gray[900], fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  state: { alignItems: "center", paddingVertical: 48, gap: 16 },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.gray[100], alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.gray[900] },
  stateText: { textAlign: "center", color: colors.gray[600], fontSize: 15, lineHeight: 23 },
  textButton: { minHeight: 44, justifyContent: "center" },
  link: { color: colors.accent, fontSize: 15, fontWeight: "700" },
  feedback: { padding: 16, borderRadius: 16, backgroundColor: colors.gray[100] },
  error: { color: colors.error[600], fontSize: 14, lineHeight: 22 },
});

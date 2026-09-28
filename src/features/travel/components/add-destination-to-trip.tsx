import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tripsApi, useReplaceTripStops, useTrips } from "@/features/trips/services/trips-api-service";
import { DetailAction, DetailState, detailStyles as s } from "./detail-ui";

export function AddDestinationToTrip({ destinationId, onClose }: { destinationId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const trips = useTrips();
  const replace = useReplaceTripStops();
  const [busy, setBusy] = useState(false);
  const owned = (trips.data ?? []).filter((trip) => trip.accessRole === "owner");
  const add = async (id: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const { data: trip } = await tripsApi.get(id);
      if (trip.stops.some((stop) => stop.destinationId === destinationId)) {
        Alert.alert(t("detailGuide.alreadyAdded"));
        return;
      }
      if (trip.stops.length >= 5) {
        Alert.alert(t("detailGuide.tripFull"));
        return;
      }
      await replace.mutateAsync({ id, stops: [...trip.stops.map((stop) => ({ destinationId: stop.destinationId })), { destinationId }] });
      Alert.alert(t("detailGuide.added"));
      onClose();
    } catch {
      Alert.alert(t("detailGuide.saveError"));
    } finally {
      setBusy(false);
    }
  };
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { if (!busy) onClose(); }}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
      <Text style={s.heading}>{t("detailGuide.addToTrip")}</Text>
      <Text style={s.body}>{t("detailGuide.chooseTrip")}</Text>
      {trips.isPending ? <DetailState loading /> : trips.isError ? <DetailState onRetry={() => void trips.refetch()} /> : owned.length ? owned.map((trip) => <View key={trip.id} style={s.card}><Text selectable style={s.label}>{trip.name}</Text><DetailAction label={t("detailGuide.addHere")} icon="add" disabled={busy} onPress={() => void add(trip.id)} /></View>) : <Text style={s.body}>{t("detailGuide.noTrips")}</Text>}
      <DetailAction label={t("detailGuide.close")} icon="close" disabled={busy} onPress={onClose} />
    </ScrollView>
  </Modal>;
}

import { Redirect, useLocalSearchParams } from "expo-router";
export default function LegacyExplore() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const id = Number(tripId);
  return <Redirect href={Number.isInteger(id) && id > 0 ? { pathname: "/planner/[tripId]", params: { tripId: String(id) } } : "/planner"} />;
}

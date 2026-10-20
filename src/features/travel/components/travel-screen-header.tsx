import { JourneyHeader } from "@/components/ui/journey-header";

type TravelScreenHeaderProps = {
  title: string;
  showBack?: boolean;
};

export function TravelScreenHeader(props: TravelScreenHeaderProps) {
  return <JourneyHeader {...props} />;
}

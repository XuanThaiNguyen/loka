import { useTranslation } from "react-i18next";

import { PlaceholderScreen } from "@/components/core/placeholder-screen";

export default function ExploreScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t("explore.title")}
      description={t("explore.description")}
    />
  );
}

import { useTranslation } from "react-i18next";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { detailStyles as s } from "./detail-ui";

type Props = { sources?: { label: string; url: string; checkedOn: string }[]; contentLocale?: string };
export function ContentSources({ sources = [], contentLocale }: Props) {
  const { t, i18n } = useTranslation();
  if (!sources.length && !contentLocale) return null;
  return <View style={{ gap: 10 }}>
    {contentLocale && contentLocale !== i18n.language.slice(0, 2) ? <Text style={s.body}>{t("catalogContent.fallback")}</Text> : null}
    {sources.length ? <>
      <Text style={s.heading}>{t("catalogContent.sources")}</Text>
      {sources.map((source) => <Pressable key={source.url} accessibilityRole="link" onPress={() => { if (source.url.startsWith("https://")) void Linking.openURL(source.url).catch(() => Alert.alert(t("visitKnowledge.linkError"))); }} style={{ minHeight: 44, justifyContent: "center", gap: 4 }}>
        <Text style={s.actionText}>{source.label}</Text>
        <Text style={s.body}>{t("catalogContent.checked", { date: new Intl.DateTimeFormat(i18n.language).format(new Date(`${source.checkedOn}T00:00:00`)) })}</Text>
      </Pressable>)}
    </> : null}
  </View>;
}

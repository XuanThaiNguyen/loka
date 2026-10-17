import Ionicons from "@expo/vector-icons/Ionicons";
import { Image as ExpoImage, type ImageProps } from "expo-image";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { env } from "@/config/env";

export function catalogImageUrl(value: string): string | undefined {
  if (!value || value.includes("images.example.com")) return undefined;
  try {
    const url = new URL(value);
    if (["localhost", "127.0.0.1"].includes(url.hostname) && url.pathname.startsWith("/api/city-photos/")) return `${env.apiBaseURL}${url.pathname}`;
    return url.protocol === "https:" || url.protocol === "http:" ? value : undefined;
  } catch { return undefined; }
}

/** Neutral artwork when the catalog has no approved photo or a remote asset fails. */
export function CatalogImage({ source, style, onError, fallbackHeight, ...props }: ImageProps & { fallbackHeight?: number }) {
  const originalUri = source && typeof source === "object" && !Array.isArray(source) && "uri" in source ? source.uri : undefined;
  const uri = originalUri ? catalogImageUrl(originalUri) : undefined;
  const [failedUri, setFailedUri] = useState<string>();
  return <View style={[{ backgroundColor: "#e4ece8", overflow: "hidden", alignItems: "center", justifyContent: "center" }, style as StyleProp<ViewStyle>, (!uri || failedUri === uri) && fallbackHeight !== undefined ? { height: fallbackHeight, aspectRatio: "auto" } : undefined]}>
    {uri && failedUri !== uri ? <ExpoImage {...props} source={{ uri }} style={StyleSheet.absoluteFill} onError={(event) => { setFailedUri(uri); onError?.(event); }} /> : <Ionicons name="image-outline" size={28} color="#84968d" accessibilityElementsHidden importantForAccessibility="no" />}
  </View>;
}

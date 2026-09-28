/** Public GET /api/cities/:id contract, mirrored from pland city-guides.contracts.ts. */
export type CityGuideAccent = "coral" | "sunset" | "gold" | "mint" | "sky" | "lilac" | "rose";
export type CityGuideLayout = "snippets" | "highlights" | "masonry" | "checklist" | "badges" | "rail" | "info" | "cta";
export type CityGuideItem = {
  id: string;
  position: number;
  title: string;
  description: string | null;
  emoji: string | null;
  accent: CityGuideAccent | null;
  tag: string | null;
  highlight: string | null;
  ratio: "tall" | "portrait" | "square" | "landscape" | null;
  stat: string | null;
  points: string[];
  note: string | null;
  navLabel: string | null;
};
export type CityGuideSection = {
  id: string;
  position: number;
  layout: CityGuideLayout;
  eyebrow: string | null;
  title: string;
  navLabel: string | null;
  snippets: string[];
  actionLabel: string | null;
  items: CityGuideItem[];
};
export type CityGuide = { hook: string | null; sections: CityGuideSection[] };

// Keep the server's order, including its tie-break ordering. Ignore future layouts safely.
const layouts: readonly string[] = ["snippets", "highlights", "masonry", "checklist", "badges", "rail", "info", "cta"];
export function supportedGuideSections(guide: CityGuide): CityGuideSection[] {
  return (guide.sections ?? []).filter((section) => layouts.includes(section.layout));
}

/** Pastel artwork from the web GuideLayout, not a replacement for the brand tokens. */
export const guideWashes: Record<CityGuideAccent, readonly [string, string, string]> = {
  coral: ["#ffe1d6", "#ffb9a3", "#ff8d7a"],
  sunset: ["#ffe9c9", "#ffc178", "#ff8f4d"],
  gold: ["#fff6cc", "#ffdf85", "#ffbf3c"],
  mint: ["#dcf7e9", "#a9ecc9", "#63d3a4"],
  sky: ["#dceeff", "#a9d7ff", "#6fb8ff"],
  lilac: ["#ece1ff", "#cbb9ff", "#a689ff"],
  rose: ["#ffe3f0", "#ffb6d4", "#ff7fae"],
};
export function guideWash(accent: CityGuideAccent | null = "coral") {
  const [start, middle, end] = guideWashes[accent ?? "coral"] ?? guideWashes.coral;
  return { backgroundColor: start, experimental_backgroundImage: `linear-gradient(135deg, ${start} 0%, ${middle} 55%, ${end} 100%)` };
}

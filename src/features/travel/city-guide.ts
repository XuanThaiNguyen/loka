import { travelSurfaces } from "@/theme/theme";

/** Public GET /api/cities/:id contract, mirrored from pland city-guides.contracts.ts. */
export type CityGuideAccent = "coral" | "sunset" | "gold" | "mint" | "sky" | "lilac" | "rose";
export type CityGuideLayout = "snippets" | "highlights" | "masonry" | "checklist" | "badges" | "rail" | "info" | "cta";
export type ContentTarget = { kind: "destination" | "city"; id: string } | { kind: "trip"; cityId: string };
export type CityGuideItem = {
  imageUrl?: string | null;
  target?: ContentTarget | null;
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
  target?: ContentTarget | null;
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

/** Semantic knowledge wash; editorial accents do not change text contrast. */
export function guideWash(_accent: CityGuideAccent | null = "coral") {
  return { backgroundColor: travelSurfaces.info };
}

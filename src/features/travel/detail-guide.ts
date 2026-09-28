/** Optional editorial content for the mobile UI; not an assumed backend contract. */
export type DetailGuide = {
  address?: string;
  visitDuration?: string;
  bestTimeOfDay?: string;
  bestSeason?: string;
  transport?: string;
  accessibility?: string;
  facilities?: string;
  bookingAdvice?: string;
  safetyNotes?: string;
  bestFor?: readonly string[];
};

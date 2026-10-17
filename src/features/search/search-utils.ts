export type SearchScope = "all" | "places" | "cities" | "people";

export function matchesSearch(query: string, fields: readonly string[]) {
  const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const text = normalize(fields.join(" "));
  return normalize(query).split(/[\s,]+/).filter(Boolean).every((term) => text.includes(term));
}

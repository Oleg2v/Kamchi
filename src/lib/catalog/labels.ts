import type { Bi } from "../i18n";
import type { FacetKey, SizeBucket, SortKey } from "./filter";

export const SORT_LABEL: Record<SortKey, Bi> = {
  featured: { he: "מומלצים", en: "Recommended" },
  "price-asc": { he: "מחיר ↑", en: "Price ↑" },
  "price-desc": { he: "מחיר ↓", en: "Price ↓" },
  "lumens-desc": { he: "לומן ↓", en: "Lumens ↓" },
  new: { he: "חדש", en: "New" },
};

export const SIZE_LABEL: Record<SizeBucket, Bi> = {
  small: { he: "קטן · עד 30 ס״מ", en: "Small · up to 30 cm" },
  medium: { he: "בינוני · עד 80 ס״מ", en: "Medium · up to 80 cm" },
  large: { he: "גדול", en: "Large" },
};

export const SIZE_SHORT: Record<SizeBucket, Bi> = {
  small: { he: "קטן", en: "Small" },
  medium: { he: "בינוני", en: "Medium" },
  large: { he: "גדול", en: "Large" },
};

export const FACET_LABEL: Record<FacetKey | "price" | "q", Bi> = {
  space: { he: "חלל", en: "Space" },
  brand: { he: "מותג", en: "Brand" },
  type: { he: "סוג", en: "Type" },
  size: { he: "גודל", en: "Size" },
  k: { he: "טמפרטורת צבע", en: "Colour temperature" },
  dim: { he: "עמעום", en: "Dimming" },
  ip: { he: "דרגת אטימות", en: "IP rating" },
  price: { he: "מחיר", en: "Price" },
  q: { he: "חיפוש", en: "Search" },
};

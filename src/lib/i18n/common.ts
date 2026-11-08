import type { Bi } from "./index";
import type { FixtureType, Space, Dimming, LeadTime, OrderStatus, ProjectStatus, FinishId } from "../types";

export const NAV: { href: string; label: Bi }[] = [
  { href: "/catalog", label: { he: "קטלוג", en: "Catalogue" } },
  { href: "/relight", label: { he: "תאירו לי את הסלון", en: "Light my room" } },
  { href: "/plan", label: { he: "תוכנית תאורה", en: "Lighting plan" } },
  { href: "/consultant", label: { he: "היועץ", en: "Consultant" } },
  { href: "/projects", label: { he: "פרויקטים", en: "Projects" } },
  { href: "/about", label: { he: "אודות", en: "About" } },
];

export const PORTAL_NAV = {
  studio: { href: "/studio", label: { he: "הסטודיו", en: "Studio" } },
  desk: { href: "/desk", label: { he: "שולחן הפרויקטים", en: "Desk" } },
  live: { href: "/live", label: { he: "מצב חי", en: "Live" } },
};

export const BRAND_NAME: Bi = { he: "קמחי תאורה", en: "Kamchi Lighting" };
export const TAGLINE: Bi = { he: "אור הוא העיצוב", en: "Light is the design" };
export const SHOWROOM: Bi = { he: "באולם התצוגה בבני ברק", en: "In the Bnei Brak showroom" };
export const ADDRESS: Bi = { he: "לח״י 23, בני ברק — ליד מרכז העיצוב", en: "23 Lehi St., Bnei Brak — next to the Design Center" };
export const DEMO_BADGE: Bi = { he: "קונספט של Kikkey — לא האתר הרשמי של קמחי תאורה", en: "A Kikkey concept — not the official Kamchi Lighting site" };
export const BETA: Bi = { he: "בטא", en: "Beta" };
export const SIMULATION: Bi = { he: "הדמיה", en: "Simulation" };
export const DEMO_PRICE: Bi = { he: "מחיר הדגמה", en: "Demo price" };

export const FIXTURE_TYPE_LABEL: Record<FixtureType, Bi> = {
  pendant: { he: "תלוי", en: "Pendant" },
  chandelier: { he: "נברשת", en: "Chandelier" },
  wall: { he: "קיר", en: "Wall" },
  ceiling: { he: "צמוד תקרה", en: "Ceiling" },
  recessed: { he: "שקוע", en: "Recessed" },
  track: { he: "פס צבירה", en: "Track" },
  floor: { he: "עומד", en: "Floor" },
  table: { he: "שולחני", en: "Table" },
  linear: { he: "ליניארי", en: "Linear" },
  outdoor: { he: "חוץ", en: "Outdoor" },
};

export const SPACE_LABEL: Record<Space, Bi> = {
  living: { he: "סלון", en: "Living room" },
  dining: { he: "פינת אוכל", en: "Dining" },
  kitchen: { he: "מטבח", en: "Kitchen" },
  bedroom: { he: "חדר שינה", en: "Bedroom" },
  bathroom: { he: "חדר רחצה", en: "Bathroom" },
  office: { he: "משרד", en: "Office" },
  hallway: { he: "מסדרון", en: "Hallway" },
  outdoor: { he: "חוץ ומרפסת", en: "Outdoor & terrace" },
  commercial: { he: "מסחרי", en: "Commercial" },
};

export const DIMMING_LABEL: Record<Dimming, Bi> = {
  none: { he: "ללא עמעום", en: "Non-dimmable" },
  phase: { he: "עמעום פאזה", en: "Phase dimming" },
  dali: { he: "DALI", en: "DALI" },
  "1-10v": { he: "1–10V", en: "1–10V" },
  push: { he: "Push-dim", en: "Push-dim" },
  casambi: { he: "Casambi", en: "Casambi" },
};

export const LEAD_TIME_LABEL: Record<LeadTime, Bi> = {
  stock: { he: "במלאי בבני ברק", en: "In stock in Bnei Brak" },
  "weeks-2-4": { he: "2–4 שבועות", en: "2–4 weeks" },
  "weeks-6-8": { he: "6–8 שבועות", en: "6–8 weeks" },
  "weeks-10-12": { he: "10–12 שבועות", en: "10–12 weeks" },
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, Bi> = {
  quoted: { he: "ממתין לאישור", en: "Quoted" },
  ordered_italy: { he: "הוזמן באיטליה", en: "Ordered in Italy" },
  in_transit: { he: "בדרך", en: "In transit" },
  in_warehouse: { he: "במחסן", en: "In warehouse" },
  delivered: { he: "סופק", en: "Delivered" },
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, Bi> = {
  planning: { he: "בתכנון", en: "Planning" },
  quote_requested: { he: "ממתין להצעה", en: "Quote requested" },
  quoted: { he: "הצעה נשלחה", en: "Quoted" },
  ordered: { he: "הוזמן", en: "Ordered" },
  delivered: { he: "סופק", en: "Delivered" },
};

export const FINISH_LABEL: Record<FinishId, Bi> = {
  black: { he: "שחור", en: "Black" },
  white: { he: "לבן", en: "White" },
  brass: { he: "פליז", en: "Brass" },
  bronze: { he: "ברונזה", en: "Bronze" },
  chrome: { he: "כרום", en: "Chrome" },
  nickel: { he: "ניקל", en: "Nickel" },
  copper: { he: "נחושת", en: "Copper" },
  "smoke-glass": { he: "זכוכית מעושנת", en: "Smoked glass" },
  "clear-glass": { he: "זכוכית שקופה", en: "Clear glass" },
  "opal-glass": { he: "זכוכית אופל", en: "Opal glass" },
  "amber-glass": { he: "זכוכית ענבר", en: "Amber glass" },
  terracotta: { he: "טרקוטה", en: "Terracotta" },
  oak: { he: "אלון", en: "Oak" },
  walnut: { he: "אגוז", en: "Walnut" },
  concrete: { he: "בטון", en: "Concrete" },
};

export const FINISH_HEX: Record<FinishId, string> = {
  black: "#141414", white: "#F2EEE6", brass: "#B8955B", bronze: "#5A4634", chrome: "#C9CCD1",
  nickel: "#AFB2B5", copper: "#B87333", "smoke-glass": "#4A4A4D", "clear-glass": "#D9E2E6",
  "opal-glass": "#EDEDEA", "amber-glass": "#D9A35A", terracotta: "#B3674A", oak: "#B88A5C",
  walnut: "#5C3F2E", concrete: "#8E8E8A",
};

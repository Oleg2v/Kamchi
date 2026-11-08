import { FIXTURES } from "../data";
import { FIXTURE_TYPE_LABEL, SPACE_LABEL } from "../i18n/common";
import type { ConsultantAnswer, Dimming, Fixture, FixtureType, Kelvin, Space } from "../types";
import { TARGET_LUX } from "./plan-rules";
import { brandName, fact, type Fact, type FactField } from "./validate";

/* ─────────────────────────────────────────────────────────────
   "היועץ" without a model: a rules + retrieval engine over FIXTURES.
   Hebrew and English. It detects the space, fixture type, colour
   temperature, dimming protocol, ceiling height, table length, area
   and budget, scores every fixture, and answers with 2–4 products
   plus facts quoted from the data. If nothing fits, it says so.
   ───────────────────────────────────────────────────────────── */

export interface ChatTurn { role: "user" | "assistant"; content: string }

type Topic = "dimming" | "kelvin" | "ip" | "cri" | "lux" | "hang" | "lead";

export interface Intent {
  spaces: Space[];
  types: FixtureType[];
  kelvin?: Kelvin;
  dimming: Dimming[];
  wantsDimming: boolean;
  ceilingM?: number;
  lowCeiling: boolean;
  highCeiling: boolean;
  tableM?: number;
  areaM2?: number;
  budget?: number;
  minIp?: number;
  brand?: string;
  topic?: Topic;
  mentioned: string[];
  isHebrew: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const SPACE_WORDS: Record<Space, string[]> = {
  bathroom: ["אמבטיה", "אמבט", "מקלחת", "חדר רחצה", "רחצה", "שירותים", "bathroom", "shower", "bath ", "wc", "ensuite"],
  outdoor: ["חוץ", "מרפסת", "גינה", "חצר", "פרגולה", "שביל", "outdoor", "terrace", "balcony", "garden", "patio", "exterior", "path"],
  kitchen: ["מטבח", "אי ", "האי", "kitchen", "island", "worktop", "counter"],
  dining: ["פינת אוכל", "פינת האוכל", "שולחן אוכל", "שולחן האוכל", "שולחן", "dining", "table"],
  living: ["סלון", "living", "lounge", "sofa", "ספה"],
  bedroom: ["חדר שינה", "חדר השינה", "מיטה", "bedroom", "bedside", "headboard"],
  office: ["משרד", "חדר עבודה", "שולחן עבודה", "שולחן כתיבה", "office", "study", "desk", "workspace"],
  hallway: ["מסדרון", "פרוזדור", "כניסה", "לובי", "מבואה", "hallway", "corridor", "entrance", "lobby", "hall"],
  commercial: ["מסחרי", "חנות", "מסעדה", "בית קפה", "משרדים", "אולם", "commercial", "shop", "restaurant", "retail", "showroom", "cafe", "café"],
};

const TYPE_WORDS: Record<FixtureType, string[]> = {
  pendant: ["תלוי", "תלויה", "תלויים", "תלויות", "תליה", "תלייה", "pendant", "hanging", "suspension", "suspended"],
  chandelier: ["נברשת", "נברשות", "chandelier"],
  recessed: ["שקוע", "שקועים", "שקועה", "שקועות", "דאונלייט", "ספוט", "ספוטים", "downlight", "recessed", "spotlight", "spots"],
  wall: ["קיר", "wall", "sconce"],
  track: ["פס צבירה", "פסי צבירה", "מסילה", "מגנטי", "track", "rail"],
  floor: ["עומד", "עומדת", "עומדים", "רצפה", "floor lamp", "standing", "floor light", "floor "],
  table: ["שולחני", "שולחנית", "מנורת שולחן", "מנורת לילה", "מנורת קריאה", "table lamp", "desk lamp", "bedside lamp", "reading lamp"],
  linear: ["ליניארי", "לינארי", "ליניארית", "לינארית", "פרופיל", "linear", "profile"],
  ceiling: ["צמוד תקרה", "צמודי תקרה", "צמוד־תקרה", "צמוד", "ceiling mounted", "ceiling-mounted", "flush", "surface mounted", "surface-mounted"],
  outdoor: ["עמודון", "bollard"],
};

const BRAND_WORDS: Record<string, string[]> = {
  artemide: ["artemide", "ארטמידה"], vibia: ["vibia", "ויביה"], bomma: ["bomma", "בומה"], terzani: ["terzani", "טרצאני", "טרזאני"],
  panzeri: ["panzeri", "פנצרי"], fabbian: ["fabbian", "פביאן"], exenia: ["exenia", "אקסניה"], ole: ["ole ", "אולה"], neko: ["neko", "נקו"],
  "cangini-tucci": ["cangini", "קנג'יני", "קנג׳יני"], dechem: ["dechem", "דכם"], icone: ["icone", "איקונה"], avolux: ["avolux", "אבולוקס"],
  vesoi: ["vesoi", "וסוי"], "aldo-bernardi": ["bernardi", "ברנרדי"], swarovski: ["swarovski", "סברובסקי"],
};

const num = (s: string) => parseFloat(s.replace(",", "."));

function parseIntent(text: string, prev?: Intent): Intent {
  const raw = text.normalize("NFKC");
  const q = ` ${raw.toLowerCase()} `;
  const isHebrew = /[֐-׿]/.test(raw);

  const spaces: Space[] = [];
  for (const s of Object.keys(SPACE_WORDS) as Space[]) if (SPACE_WORDS[s].some((w) => q.includes(w))) spaces.push(s);
  // "desk" / "שולחן עבודה" means office, not dining.
  if (spaces.includes("office") && spaces.includes("dining") && !/פינת|dining|אוכל/.test(q)) spaces.splice(spaces.indexOf("dining"), 1);

  const types: FixtureType[] = [];
  for (const t of Object.keys(TYPE_WORDS) as FixtureType[]) if (TYPE_WORDS[t].some((w) => q.includes(w))) types.push(t);
  // "גובה תקרה"/"ceiling height" is not a request for ceiling fixtures.
  if (types.includes("ceiling") && !/צמוד|flush|surface|mounted/.test(q)) types.splice(types.indexOf("ceiling"), 1);
  // "wall" inside "wall wash"/"קיר" is fine; "floor" inside "floor plan" is not.
  if (types.includes("floor") && /floor plan|תוכנית/.test(q)) types.splice(types.indexOf("floor"), 1);

  let kelvin: Kelvin | undefined;
  // A kelvin number is never a price: not after ₪ / digits, not before a currency word.
  const kNum = (n: string) => new RegExp(`(?<![\\d₪])${n}(?!\\d)(?!\\s*(?:₪|שקל|ש[״"]ח|ils|nis))`).test(q);
  if (kNum("2700")) kelvin = 2700;
  else if (kNum("3000")) kelvin = 3000;
  else if (kNum("4000")) kelvin = 4000;
  else if (/חם מאוד|very warm|candle|(?<![\u0590-\u05FF])נר(?![\u0590-\u05FF])/.test(q)) kelvin = 2700;
  else if (/ניטרלי|neutral|(?<![\u0590-\u05FF])לבן(?![\u0590-\u05FF])|white light|(?<![\u0590-\u05FF])קר(?![\u0590-\u05FF])|cool white|daylight/.test(q)) kelvin = 4000;
  else if (/(?<![\u0590-\u05FF])חם(?![\u0590-\u05FF])|חמה(?![\u0590-\u05FF])|חמים|warm/.test(q)) kelvin = 2700;

  const dimming: Dimming[] = [];
  if (/dali|דאלי/.test(q)) dimming.push("dali");
  if (/פאזה|phase|triac|טריאק|leading|trailing|דימר קיר/.test(q)) dimming.push("phase");
  if (/push|פוש|לחצן/.test(q)) dimming.push("push");
  if (/casambi|קסמבי|bluetooth|אפליקציה|אלחוטי|wireless|app\b/.test(q)) dimming.push("casambi");
  if (/1-10|0-10|1–10|0–10/.test(q)) dimming.push("1-10v");
  const wantsDimming = dimming.length > 0 || /עמעום|מעומעם|דימר|dimm|עמעם/.test(q);

  let ceilingM: number | undefined;
  const c1 = q.match(/(?:תקרה|ceiling)[^\d]{0,24}(\d(?:[.,]\d+)?)\s*(?:מ[׳']|מטר|m\b|meter|metre)/);
  const c2 = q.match(/(\d(?:[.,]\d+)?)\s*(?:מ[׳']|מטר|m\b|meter|metre)[^\d]{0,16}(?:תקרה|ceiling)/);
  if (c1) ceilingM = num(c1[1]); else if (c2) ceilingM = num(c2[1]);
  const lowCeiling = (ceilingM !== undefined && ceilingM < 2.5) || /תקרה נמוכה|תקרות נמוכות|low ceiling|low ceilings/.test(q);
  const highCeiling = (ceilingM !== undefined && ceilingM >= 3.2) || /תקרה גבוהה|תקרות גבוהות|תקרה כפולה|high ceiling|double height|חלל כפול/.test(q);

  let tableM: number | undefined;
  const t1 = q.match(/(?:שולחן|table|island|אי)[^\d]{0,30}(\d(?:[.,]\d+)?)\s*(?:מ[׳']|מטר|m\b|meter|metre)/);
  const t2 = q.match(/(\d(?:[.,]\d+)?)\s*(?:מ[׳']|מטר|m\b|meter|metre)[^\d]{0,12}(?:שולחן|table|island)/);
  const t3 = q.match(/(?:שולחן|table)[^\d]{0,30}(\d{3})\s*(?:ס[״"']?מ|cm)/);
  if (t1) tableM = num(t1[1]); else if (t2) tableM = num(t2[1]); else if (t3) tableM = num(t3[1]) / 100;
  if (tableM !== undefined && !spaces.length) spaces.push("dining");

  let areaM2: number | undefined;
  const a1 = q.match(/(\d{1,3}(?:[.,]\d)?)\s*(?:מ[״"']?ר(?![\u0590-\u05FF])|m2|m²|sqm|sq m|square met)/);
  if (a1) areaM2 = num(a1[1]);

  let budget: number | undefined;
  const b1 = q.match(/(?:₪|שקל|ש[״"]ח|ils|nis|תקציב(?: של)?)\s*(\d[\d,.]*)/) ?? q.match(/(\d[\d,.]*)\s*(?:₪|שקל|ש[״"]ח|ils|nis)/);
  if (b1) { const v = parseFloat(b1[1].replace(/,/g, "")); if (v >= 100) budget = v; }

  let brand: string | undefined;
  for (const b of Object.keys(BRAND_WORDS)) if (BRAND_WORDS[b].some((w) => q.includes(w))) { brand = b; break; }

  const mentioned: string[] = [];
  for (const f of FIXTURES) {
    const en = f.name.toLowerCase();
    if ((en.length >= 4 && q.includes(en)) || q.includes(f.nameHe.toLowerCase())) mentioned.push(f.id);
  }

  let topic: Topic | undefined;
  const asksWhat = /הבדל|מה זה|מהו|מהי|איך עובד|מה עדיף|למה|difference|what is|what's|how does|which is better|explain|vs\b|לעומת|או /.test(q);
  if (asksWhat && (dimming.length || /עמעום|dimm/.test(q))) topic = "dimming";
  else if (asksWhat && /2700|3000|4000|קלווין|kelvin|טמפרטור|colou?r temp|warm|חם|ניטרלי/.test(q)) topic = "kelvin";
  else if (/\bip\s?\d\d|\bip\b|אטימות|דרגת הגנה|עמיד למים|מוגן מים|waterproof|splash/.test(q) && (asksWhat || !spaces.length)) topic = "ip";
  else if (/\bcri\b|מסירת צבע|מדד צבע|colou?r rendering/.test(q)) topic = "cri";
  else if (/לוקס|lux|לומן למ|lumens? per|כמה אור|כמה לומן|how many lumens|how much light|כמה גופים|how many fixtures|כמה יחידות/.test(q)) topic = "lux";
  else if (/גובה תליה|גובה תלייה|באיזה גובה|how high|hanging height|מהמשטח/.test(q)) topic = "hang";
  else if (/זמן אספקה|אספקה|במלאי|lead time|in stock|delivery/.test(q)) topic = "lead";

  let minIp: number | undefined;
  if (spaces.includes("outdoor")) minIp = 65;
  else if (spaces.includes("bathroom")) minIp = 44;
  const ipAsk = q.match(/ip\s?(\d\d)/);
  if (ipAsk) minIp = Math.max(minIp ?? 0, parseInt(ipAsk[1], 10));

  const intent: Intent = { spaces, types, kelvin, dimming, wantsDimming, ceilingM, lowCeiling, highCeiling, tableM, areaM2, budget, minIp, brand, topic, mentioned, isHebrew };

  // Follow-up turns ("ומה עם DALI?") inherit the space / type / kelvin of the previous question —
  // but only when the turn carries some lighting signal, so an unrelated question is not answered twice.
  const followUp = /^\s*(ומה|מה עם|מה לגבי|ואם|אם |וגם|גם |what about|and what|how about|also|what if)/i.test(raw);
  const signal = !!(kelvin || dimming.length || wantsDimming || ceilingM !== undefined || lowCeiling || highCeiling || tableM !== undefined || areaM2 || budget || brand || ipAsk || /אור|תאורה|גוף|לומן|מנור|עמעום|light|lamp|lux|lumen|fixture|dimm/.test(q));
  if (prev && !spaces.length && !types.length && !mentioned.length && !topic && (signal || followUp)) {
    intent.spaces = prev.spaces;
    intent.types = prev.types;
    intent.kelvin = intent.kelvin ?? prev.kelvin;
    intent.minIp = intent.minIp ?? prev.minIp;
    intent.areaM2 = intent.areaM2 ?? prev.areaM2;
    intent.lowCeiling = intent.lowCeiling || prev.lowCeiling;
    intent.highCeiling = intent.highCeiling || prev.highCeiling;
  }
  return intent;
}

function score(f: Fixture, it: Intent): number {
  let s = 0;
  if (it.spaces.length) s += f.spaces.some((x) => it.spaces.includes(x)) ? 5 : -3;
  if (it.types.length) s += it.types.includes(f.type) ? 6 : -8;
  if (it.kelvin) s += f.kelvin.includes(it.kelvin) ? 2 : -4;
  if (it.dimming.length) { const n = f.dimming.filter((d) => it.dimming.includes(d)).length; s += n ? 3 + n : -5; }
  else if (it.wantsDimming) s += f.dimming.includes("none") ? -5 : 1;
  const hangs = f.type === "pendant" || f.type === "chandelier";
  if (it.lowCeiling) s += hangs ? (it.types.includes(f.type) ? -1 : -6) : f.type === "recessed" || f.type === "ceiling" || f.type === "wall" ? 2 : 0;
  if (it.highCeiling) s += hangs ? 2 : 0;
  if (it.tableM !== undefined && it.tableM >= 2.2) s += f.type === "linear" ? 3 : f.type === "pendant" ? 2 : f.type === "chandelier" ? 1 : 0;
  if (it.tableM !== undefined && it.tableM < 2.2 && f.type === "linear") s -= 1;
  if (it.brand) s += f.brand === it.brand ? 6 : -10;
  s += f.featured * 0.3;
  return s;
}

const he = (it: Intent, s: string, e: string) => (it.isHebrew ? s : e);

const TOPIC_TEXT: Record<Topic, { he: string; en: string }> = {
  dimming: {
    he: "DALI הוא פרוטוקול דיגיטלי דו־כיווני: לכל גוף כתובת משלו, אפשר לקבץ, לכתוב סצנות ולקבל משוב על תקלות, והעמעום חלק עד אחוזים בודדים — אבל צריך בקר, כבל בקרה ודרייבר DALI. עמעום פאזה (TRIAC) עובד על קו החשמל הקיים עם דימר קיר רגיל: פשוט וזול יותר, רגיש לתאימות בין הדימר לדרייבר ועלול להבהב בעוצמות נמוכות. Push-dim הוא לחצן רגיל שמחובר לדרייבר מתאים, ו־Casambi נותן שליטה אלחוטית מהטלפון בלי כבל בקרה.",
    en: "DALI is a two-way digital protocol: every fixture gets an address, you can group, write scenes and get fault feedback, and dimming stays smooth down to a few percent — but it needs a controller, a control cable and DALI drivers. Phase (TRIAC) dimming works on the existing mains with an ordinary wall dimmer: simpler and cheaper, sensitive to dimmer/driver compatibility and prone to flicker at low levels. Push-dim is a plain push button wired to a suitable driver; Casambi gives wireless control from a phone with no control cable.",
  },
  kelvin: {
    he: "2700K הוא אור חם מאוד, קרוב לליבון — סלון, חדר שינה, מסעדות. 3000K חם אך נקי יותר, הסטנדרט למגורים ולמטבחים. 4000K ניטרלי, למשרדים, חללי עבודה ומסחר. ככלל לא מערבבים טמפרטורות באותו חלל, ובחדר אחד עדיף גם אותו CRI.",
    en: "2700K is very warm, close to incandescent — living rooms, bedrooms, restaurants. 3000K is warm but cleaner, the residential and kitchen standard. 4000K is neutral, for offices, workspaces and retail. As a rule, do not mix colour temperatures in one room, and keep the CRI consistent too.",
  },
  ip: {
    he: "IP20 מתאים לחללים יבשים. IP44 מוגן מהתזות — אזור 2 בחדר הרחצה, מחוץ לתא המקלחת ולאמבטיה. IP65 מוגן מסילוני מים ואבק — מרפסות, גינות, ובתוך תא המקלחת (אזור 1). IP67 עמיד בטבילה זמנית, לגינות מושקות ולריצוף חוץ.",
    en: "IP20 is for dry spaces. IP44 is splash-proof — zone 2 of a bathroom, outside the shower and bath. IP65 withstands water jets and dust — terraces, gardens and inside the shower enclosure (zone 1). IP67 survives temporary immersion, for irrigated gardens and in-ground outdoor fittings.",
  },
  cri: {
    he: "CRI (מדד מסירת צבע) מתאר עד כמה הצבעים נראים נאמנים מתחת לאור. 80 הוא הבסיס; למגורים, לגלריות ולחנויות אופנה מומלץ 90 ומעלה; לעבודה עם צבע ולקוסמטיקה 95 ומעלה. CRI גבוה לרוב בא עם קצת פחות לומן לוואט.",
    en: "CRI (colour rendering index) describes how faithful colours look under the light. 80 is the baseline; for homes, galleries and fashion retail aim for 90+; for colour work and cosmetics 95+. Higher CRI usually costs a little efficacy.",
  },
  lux: {
    he: "כללי אצבע: סלון 150–200 לוקס, פינת אוכל 200, מטבח 300–500, משרד 500, חדר רחצה 200, מסדרון 100, חדר שינה 150. לומן נדרש ≈ לוקס × שטח במ״ר ÷ 0.5 (מקדם ניצול), ואת זה מחלקים בשטף האור של הגוף.",
    en: "Rules of thumb: living 150–200 lux, dining 200, kitchen 300–500, office 500, bathroom 200, hallway 100, bedroom 150. Lumens needed ≈ lux × area in m² ÷ 0.5 (utilisation factor), divided by the fixture's output.",
  },
  hang: {
    he: "מעל שולחן אוכל תולים 70–80 ס״מ מהמשטח; מעל אי מטבח 75–90 ס״מ. באזורי מעבר התחתית נשארת מעל 2.1 מ׳ מהרצפה. בתקרה של 2.5 מ׳ זה משאיר מקום לגוף של עד כ־40 ס״מ.",
    en: "Over a dining table hang 70–80 cm above the surface; over a kitchen island 75–90 cm. In circulation areas keep the underside above 2.1 m. With a 2.5 m ceiling that leaves room for a fixture up to about 40 cm tall.",
  },
  lead: {
    he: "זמני האספקה בדמו: במלאי בבני ברק, 2–4 שבועות, 6–8 שבועות או 10–12 שבועות מהיצרן באיטליה. הנתון מופיע ליד כל גוף.",
    en: "Demo lead times: in stock in Bnei Brak, 2–4 weeks, 6–8 weeks or 10–12 weeks from the maker in Italy. The figure is quoted per fixture.",
  },
};

function constraintSentence(it: Intent): { he: string; en: string } {
  const partsHe: string[] = [], partsEn: string[] = [];
  if (it.spaces.length) { partsHe.push(`ל${SPACE_LABEL[it.spaces[0]].he}`); partsEn.push(`for the ${SPACE_LABEL[it.spaces[0]].en.toLowerCase()}`); }
  if (it.types.length) { partsHe.push(`גוף ${FIXTURE_TYPE_LABEL[it.types[0]].he}`); partsEn.push(`${FIXTURE_TYPE_LABEL[it.types[0]].en.toLowerCase()} fixtures`); }
  if (it.kelvin) { partsHe.push(`${it.kelvin}K`); partsEn.push(`${it.kelvin}K`); }
  if (it.dimming.length) { partsHe.push(`עמעום ${it.dimming.map((d) => d.toUpperCase()).join("/")}`); partsEn.push(`${it.dimming.map((d) => d.toUpperCase()).join("/")} dimming`); }
  const notesHe: string[] = [], notesEn: string[] = [];
  if (it.minIp) { notesHe.push(`נדרשת דרגת אטימות IP${it.minIp} ומעלה`); notesEn.push(`IP${it.minIp} or better is required`); }
  if (it.lowCeiling) { notesHe.push(`בתקרה נמוכה (${it.ceilingM ? `${it.ceilingM} מ׳` : "פחות מ־2.5 מ׳"}) עדיף שקוע או צמוד תקרה על פני גוף תלוי`); notesEn.push(`with a low ceiling (${it.ceilingM ? `${it.ceilingM} m` : "under 2.5 m"}) recessed or flush fixtures beat pendants`); }
  if (it.highCeiling) { notesHe.push("תקרה גבוהה מאפשרת גוף תלוי או נברשת עם נפח"); notesEn.push("a high ceiling allows a pendant or chandelier with real volume"); }
  if (it.tableM !== undefined) {
    if (it.tableM >= 2.2) { notesHe.push(`לשולחן של ${it.tableM} מ׳ מתאים פרופיל ליניארי או 2–3 גופים תלויים`); notesEn.push(`a ${it.tableM} m table takes a linear profile or 2–3 pendants`); }
    else { notesHe.push(`לשולחן של ${it.tableM} מ׳ מספיק גוף תלוי אחד או שניים`); notesEn.push(`a ${it.tableM} m table needs one or two pendants`); }
  }
  if (it.budget) { notesHe.push(`עד ₪${it.budget.toLocaleString("en-US")} ליחידה`); notesEn.push(`up to ₪${it.budget.toLocaleString("en-US")} per unit`); }
  const headHe = partsHe.join(", ");
  const headEn = partsEn.join(", ").replace(/^\w/, (c) => c.toUpperCase());
  const he = notesHe.length ? `${headHe ? `${headHe}: ` : ""}${notesHe.join("; ")}.` : headHe ? `${headHe}.` : "";
  const en = notesEn.length ? `${headEn ? `${headEn}: ` : ""}${notesEn.join("; ")}.` : headEn ? `${headEn}.` : "";
  return { he, en };
}

function quantityNote(it: Intent, f: Fixture): { he: string; en: string } | null {
  if (!it.areaM2 || !it.spaces.length) return null;
  if (!["recessed", "ceiling", "linear", "track"].includes(f.type)) return null;
  const lux = TARGET_LUX[it.spaces[0]];
  const qty = clamp(Math.ceil((lux * it.areaM2) / (f.lumens * 0.5)), 1, 60);
  return {
    he: `ל־${it.areaM2} מ״ר ב־${lux} לוקס: כ־${qty} יחידות של ${f.nameHe} (${f.lumens} lm כל אחת, מקדם ניצול 0.5).`,
    en: `For ${it.areaM2} m² at ${lux} lux: about ${qty} units of ${f.name} (${f.lumens} lm each, utilisation 0.5).`,
  };
}

function factsFor(f: Fixture, it: Intent): Fact[] {
  const fields: FactField[] = ["lumens", "kelvin"];
  if (it.minIp || it.topic === "ip") fields.push("ip");
  if (it.wantsDimming || it.topic === "dimming") fields.push("dimming");
  if (it.budget) fields.push("price");
  if (it.topic === "cri") fields.push("cri");
  if (it.topic === "lead") fields.push("leadTime");
  if (it.mentioned.includes(f.id)) fields.push("ip", "dimming", "size", "price", "leadTime");
  if (fields.length < 4) fields.push("dimming");
  if (fields.length < 4) fields.push("price");
  const uniq = [...new Set(fields)].slice(0, 5);
  return uniq.map((field) => fact(f, field, it.isHebrew ? "he" : "en"));
}

const list = (xs: string[], and: string) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${and}${and === "ו" ? "" : " "}${xs[xs.length - 1]}`;

/** The whole engine: previous turns give context, the last user turn is the question. */
export function simulateConsultant(turns: ChatTurn[]): ConsultantAnswer {
  const users = turns.filter((t) => t.role === "user");
  const last = users[users.length - 1]?.content ?? "";
  const prev = users.length > 1 ? parseIntent(users[users.length - 2].content) : undefined;
  const it = parseIntent(last, prev);

  // "ספרו לי על …" — a specific fixture.
  if (it.mentioned.length) {
    const picks = it.mentioned.slice(0, 3).map((id) => FIXTURES.find((f) => f.id === id)!);
    const f = picks[0];
    const spacesHe = f.spaces.map((s) => SPACE_LABEL[s].he).join(", ");
    const spacesEn = f.spaces.map((s) => SPACE_LABEL[s].en.toLowerCase()).join(", ");
    return {
      text: {
        he: `${f.nameHe} של ${brandName(f.brand)} — גוף ${FIXTURE_TYPE_LABEL[f.type].he}${f.designer ? ` בעיצוב ${f.designer}` : ""}${f.year ? ` (${f.year})` : ""}. ${f.description.he} מתאים ל${spacesHe}. הנתונים המלאים מופיעים למטה, ישירות מהקטלוג.`,
        en: `${f.name} by ${brandName(f.brand)} — a ${FIXTURE_TYPE_LABEL[f.type].en.toLowerCase()} fixture${f.designer ? ` designed by ${f.designer}` : ""}${f.year ? ` (${f.year})` : ""}. ${f.description.en} Suited to ${spacesEn}. The full figures below come straight from the catalogue.`,
      },
      fixtureIds: picks.map((p) => p.id),
      facts: picks.flatMap((p) => factsFor(p, it)),
    };
  }

  const topicText = it.topic ? TOPIC_TEXT[it.topic] : null;
  const hasConstraint = it.spaces.length || it.types.length || it.kelvin || it.dimming.length || it.brand || it.budget || it.minIp;

  // A pure knowledge question with no product constraint: explain, and show a couple of relevant examples.
  if (topicText && !hasConstraint) {
    let pool = FIXTURES;
    if (it.topic === "dimming") pool = pool.filter((f) => f.dimming.includes("dali") || f.dimming.includes("casambi"));
    if (it.topic === "ip") pool = pool.filter((f) => f.ip >= 44);
    if (it.topic === "cri") pool = pool.filter((f) => f.cri >= 92);
    if (it.topic === "kelvin") pool = pool.filter((f) => f.kelvin.length >= 2);
    const picks = [...pool].sort((a, b) => b.featured - a.featured || a.price - b.price).slice(0, it.topic === "lux" || it.topic === "hang" || it.topic === "lead" ? 0 : 2);
    const tail = picks.length ? he(it, ` דוגמאות מהקטלוג: ${list(picks.map((p) => p.nameHe), "ו")}.`, ` Examples from the catalogue: ${list(picks.map((p) => p.name), "and")}.`) : "";
    return {
      text: { he: topicText.he + (it.isHebrew ? tail : ""), en: topicText.en + (!it.isHebrew ? tail : "") },
      fixtureIds: picks.map((p) => p.id),
      facts: picks.flatMap((p) => factsFor(p, it)),
    };
  }

  if (!hasConstraint && !it.areaM2 && !it.lowCeiling && !it.tableM) {
    return {
      text: {
        he: "לא זיהיתי חלל או סוג גוף בשאלה. ספרו לי על החלל (סלון, מטבח, חדר רחצה, מרפסת), על גובה התקרה ועל האווירה שאתם מחפשים — ואציע גופים מהקטלוג עם הנתונים המדויקים שלהם.",
        en: "I could not identify a space or a fixture type in the question. Tell me about the room (living room, kitchen, bathroom, terrace), the ceiling height and the mood you are after, and I will suggest fixtures from the catalogue with their exact figures.",
      },
      fixtureIds: [],
      facts: [],
    };
  }

  let pool = FIXTURES;
  let relaxedIp = false;
  const relaxedHe: string[] = [], relaxedEn: string[] = [];
  if (it.minIp) {
    let p = pool.filter((f) => f.ip >= it.minIp!);
    if (p.length < 2 && it.minIp > 44) { p = pool.filter((f) => f.ip >= 44); relaxedIp = true; }
    pool = p;
  }
  if (it.budget) pool = pool.filter((f) => f.price <= it.budget!);
  // Explicit protocol / colour temperature / type are hard filters while they leave something to show.
  const tryFilter = (fn: (f: Fixture) => boolean, he: string, en: string) => {
    const p = pool.filter(fn);
    if (p.some((f) => score(f, it) > 0)) pool = p;
    else { relaxedHe.push(he); relaxedEn.push(en); }
  };
  if (it.types.length) tryFilter((f) => it.types.includes(f.type), `אין בקטלוג גוף ${FIXTURE_TYPE_LABEL[it.types[0]].he} שעונה על שאר התנאים, לכן הצעתי סוגים קרובים`, `no ${FIXTURE_TYPE_LABEL[it.types[0]].en.toLowerCase()} fixture in the catalogue meets the other conditions, so close types are shown`);
  // "DALI vs phase": the examples should be the ones that actually offer DALI.
  const needDim = it.topic === "dimming" && it.dimming.includes("dali") ? ["dali" as Dimming] : it.dimming;
  if (needDim.length) tryFilter((f) => f.dimming.some((d) => needDim.includes(d)), `אין גוף כזה עם עמעום ${it.dimming.map((d) => d.toUpperCase()).join("/")}, לכן מוצגים פרוטוקולי עמעום אחרים`, `none of these support ${it.dimming.map((d) => d.toUpperCase()).join("/")} dimming, so other protocols are shown`);
  if (it.kelvin) tryFilter((f) => f.kelvin.includes(it.kelvin!), `אין גוף כזה ב־${it.kelvin}K, לכן מוצגות טמפרטורות צבע סמוכות`, `none come in ${it.kelvin}K, so neighbouring colour temperatures are shown`);

  const ranked = pool.map((f) => ({ f, s: score(f, it) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.f.price - b.f.price);
  const picks = ranked.slice(0, ranked.length >= 3 && (it.tableM ?? 0) >= 2.2 ? 4 : 3).map((x) => x.f);

  if (!picks.length) {
    const c = constraintSentence(it);
    return {
      text: {
        he: `${c.he} לא מצאתי בקטלוג גוף שעונה על כל התנאים האלה. אפשר להרפות תנאי אחד — למשל התקציב, טמפרטורת הצבע או סוג העמעום — ואציע מחדש.`,
        en: `${c.en} Nothing in the catalogue meets all of these conditions. Relax one of them — the budget, the colour temperature or the dimming protocol — and I will suggest again.`,
      },
      fixtureIds: [],
      facts: [],
    };
  }

  const c = constraintSentence(it);
  const qn = quantityNote(it, picks[0]);
  const namesHe = list(picks.map((p) => `${p.nameHe} (${brandName(p.brand)})`), "ו");
  const namesEn = list(picks.map((p) => `${p.name} (${brandName(p.brand)})`), "and");
  const notesHe = [
    relaxedIp ? "בקטלוג הדמו אין די גופים ב־IP65 לסוג שביקשתם, לכן הוספתי גם IP44–IP54 — מתאימים למרפסת מקורה בלבד." : "",
    ...relaxedHe.map((x) => `${x}.`),
  ].filter(Boolean).join(" ");
  const notesEn = [
    relaxedIp ? "The demo catalogue has too few IP65 fixtures of that type, so IP44–IP54 options are included — suitable for a covered terrace only." : "",
    ...relaxedEn.map((x) => `${x.replace(/^\w/, (ch) => ch.toUpperCase())}.`),
  ].filter(Boolean).join(" ");
  const productsHe = `${c.he}${c.he ? " " : ""}מהקטלוג מתאימים ${namesHe}.${qn ? ` ${qn.he}` : ""}${notesHe ? ` ${notesHe}` : ""}`;
  const productsEn = `${c.en}${c.en ? " " : ""}From the catalogue, ${namesEn} fit.${qn ? ` ${qn.en}` : ""}${notesEn ? ` ${notesEn}` : ""}`;
  // A "what is the difference" question gets the explanation first, then the examples.
  const textHe = topicText ? `${topicText.he} ${productsHe}` : productsHe;
  const textEn = topicText ? `${topicText.en} ${productsEn}` : productsEn;

  return {
    text: { he: textHe.trim(), en: textEn.trim() },
    fixtureIds: picks.map((p) => p.id),
    facts: picks.flatMap((p) => factsFor(p, it)).slice(0, 24),
  };
}

export { parseIntent as parseConsultantIntent };

import type { Bi } from "@/lib/i18n";

/**
 * Every record the autopilot creates carries this prefix (or points at a record that does),
 * so a run can wipe its own traces and start from the same state every time.
 */
export const AUTOPILOT_PREFIX = "autopilot-";
export const AUTOPILOT_PROJECT_ID = `${AUTOPILOT_PREFIX}prj`;
export const AUTOPILOT_ROOM_ID = `${AUTOPILOT_PREFIX}room-living`;
/** The pendant the relight step hangs over the dining table — an Artemide, naturally. */
export const AUTOPILOT_FIXTURE_ID = "artemide-luce-sospesa";

export const AUTOPILOT_PROJECT_NAME: Bi = { he: "דירה בנווה צדק — הדגמה", en: "Neve Tzedek apartment — demo" };
export const AUTOPILOT_CLIENT: Bi = { he: "משפחת לוין", en: "The Levin family" };
export const AUTOPILOT_ADDRESS: Bi = { he: "שבזי, נווה צדק, תל אביב", en: "Shabazi St., Neve Tzedek, Tel Aviv" };
export const AUTOPILOT_ROOM_NAME: Bi = { he: "סלון", en: "Living room" };
export const AUTOPILOT_REQUEST_MESSAGE: Bi = {
  he: "לסלון בלבד בשלב זה. נשמח לדעת מה במלאי.",
  en: "Living room only for now. Let us know what is in stock.",
};

export const isAutopilotId = (id?: string | null) => !!id && id.startsWith(AUTOPILOT_PREFIX);

"use client";
import { useStore } from "@/lib/store";
import type { Project } from "@/lib/types";
import {
  AUTOPILOT_ADDRESS,
  AUTOPILOT_CLIENT,
  AUTOPILOT_PROJECT_ID,
  AUTOPILOT_PROJECT_NAME,
  AUTOPILOT_ROOM_ID,
  AUTOPILOT_ROOM_NAME,
  isAutopilotId,
} from "./constants";

/**
 * The one direct `setState` the autopilot is allowed: remove everything a previous run left
 * behind (project, requests, quotes, events — all keyed by the autopilot project id) and put
 * a fresh, empty autopilot project with a single living room in its place. Every later change
 * in the run goes through the real store actions, triggered by real UI handlers.
 */
export function resetAutopilotData(studioId: string): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: AUTOPILOT_PROJECT_ID,
    studioId,
    name: AUTOPILOT_PROJECT_NAME.he,
    nameEn: AUTOPILOT_PROJECT_NAME.en,
    client: AUTOPILOT_CLIENT.he,
    address: AUTOPILOT_ADDRESS.he,
    status: "planning",
    rooms: [{ id: AUTOPILOT_ROOM_ID, name: AUTOPILOT_ROOM_NAME.he, nameEn: AUTOPILOT_ROOM_NAME.en, areaM2: 32, targetLux: 150, items: [] }],
    createdAt: now,
    updatedAt: now,
  };
  useStore.setState((s) => ({
    projects: [project, ...s.projects.filter((p) => !isAutopilotId(p.id))],
    quoteRequests: s.quoteRequests.filter((q) => !isAutopilotId(q.projectId)),
    quotes: s.quotes.filter((q) => !isAutopilotId(q.projectId)),
    events: s.events.filter((e) => !isAutopilotId(e.projectId)),
  }));
  return project;
}

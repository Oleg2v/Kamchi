/**
 * Cross-tab sync for the demo store via BroadcastChannel.
 * Designer in one tab, Kamchi desk in another: every action lands in both.
 */
export const CHANNEL_NAME = "kamchi-demo-v1";

export type SyncMessage =
  | { kind: "state"; from: string; state: unknown }
  | { kind: "hello"; from: string }
  | { kind: "flash"; from: string; side: "designer" | "kamchi" };

let channel: BroadcastChannel | null = null;
export const TAB_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : String(Math.random()).slice(2, 10);

export function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function post(msg: SyncMessage) {
  getChannel()?.postMessage(msg);
}

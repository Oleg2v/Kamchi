/** Authored lighting script for the hero room (src/lib/data/hero-scene.json). */
export interface HeroLight {
  id: "pendant" | "sconce-l" | "sconce-r" | "spot-1" | "spot-2" | "spot-3" | "floor";
  order: number;
  kind: "pendant" | "wall" | "recessed" | "floor";
  fixtureAnchor: { x: number; y: number };
  lightPos: { x: number; y: number; z: number };
  shape: "pool" | "wash" | "spot" | "halo";
  radius: number;
  intensity: number;
  beamDir: { x: number; y: number } | null;
  scrollStart: number;
  scrollEnd: number;
  caption: { brand: string; model: string; price: number; lumens: number; kelvin: 2700 | 3000 };
}

export interface HeroScene {
  image: string;
  depth: string;
  aspect: number;
  horizonY: number;
  lights: HeroLight[];
}

export type RoomSceneMode =
  /** Scroll drives the lights (home hero). */
  | "scroll"
  /** Lights come on by themselves over ~6 s, then stay lit (autopilot, compact embeds). */
  | "auto"
  /** Everything already lit (reduced motion, "הכול דלוק", previews). */
  | "static";

export interface RoomSceneProps {
  mode: RoomSceneMode;
  /** 0..1 external progress for mode="scroll" (the hero passes ScrollTrigger progress). */
  progress?: number;
  /** Called once when the last light has switched on. */
  onFullyLit?: () => void;
  /** Smaller, no captions, fits a card (live mode / autopilot). */
  compact?: boolean;
  className?: string;
  /** Force the fallback renderer: "webgl" | "video" | "css". Default: auto-detect. */
  renderer?: "webgl" | "video" | "css";
}

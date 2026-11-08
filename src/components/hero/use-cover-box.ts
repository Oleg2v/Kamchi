"use client";
import { useEffect, useState, type RefObject } from "react";

export interface CoverBox {
  /** Stage size in px. */
  stageW: number;
  stageH: number;
  /** Drawn image rect in px, relative to the stage (may overflow it). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Shader mapping screen-uv → image-uv: [sx, sy, ox, oy]. */
  cover: [number, number, number, number];
}

/**
 * object-fit: cover, anchored to the top (so the ceiling fixtures stay in frame
 * on 16:9 screens); horizontally at `anchorX` (0 = left, 0.5 = centre). Shared by
 * the WebGL quad, the SVG fixture overlay and the captions so all three agree.
 */
export function computeCover(stageW: number, stageH: number, aspect: number, anchorX = 0.5): CoverBox {
  if (stageW <= 0 || stageH <= 0) return { stageW, stageH, x: 0, y: 0, w: 0, h: 0, cover: [1, 1, 0, 0] };
  const stageAspect = stageW / stageH;
  let w: number, h: number, x: number, y: number;
  if (stageAspect >= aspect) {
    w = stageW; h = stageW / aspect; x = 0; y = 0;
  } else {
    h = stageH; w = stageH * aspect; y = 0; x = (stageW - w) * anchorX;
  }
  // image uv = (screen px − offset) / drawn size
  const sx = stageW / w, sy = stageH / h;
  const ox = -x / w, oy = -y / h;
  return { stageW, stageH, x, y, w, h, cover: [sx, sy, ox, oy] };
}

export function useCoverBox(ref: RefObject<HTMLElement | null>, aspect: number, anchorX = 0.5): CoverBox {
  const [box, setBox] = useState<CoverBox>(() => computeCover(0, 0, aspect, anchorX));
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setBox((prev) => {
        const next = computeCover(Math.round(r.width), Math.round(r.height), aspect, anchorX);
        return prev.stageW === next.stageW && prev.stageH === next.stageH && prev.x === next.x ? prev : next;
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, aspect, anchorX]);
  return box;
}

/* ───────────── hero frame: where the photograph sits on the stage ───────────── */

export interface HeroFrame {
  /** Photograph beside the title (wide screens) or filling the stage. */
  split: boolean;
  /** Photo column in stage px. */
  x: number;
  w: number;
  /** Width of the dark title column (0 when not split). */
  titleW: number;
  /** Which stage side the title column takes. */
  titleSide: "left" | "right";
}

const MIN_TITLE_COLUMN = 520;

/**
 * On wide, short screens (ultrawide monitors, 1080p browsers) the whole room is
 * shown at full stage height and the title stands in the night beside it, at the
 * inline-start. Otherwise the photograph covers the stage.
 */
export function computeHeroFrame(W: number, H: number, rtl: boolean, aspect = 1.5): HeroFrame {
  const photoW = Math.round(H * aspect);
  if (W >= 1024 && H > 0 && W - photoW >= MIN_TITLE_COLUMN) {
    // Title at inline-start: right in Hebrew, left in English; the room at inline-end.
    return rtl
      ? { split: true, x: 0, w: photoW, titleW: W - photoW, titleSide: "right" }
      : { split: true, x: W - photoW, w: photoW, titleW: W - photoW, titleSide: "left" };
  }
  return { split: false, x: 0, w: W, titleW: 0, titleSide: rtl ? "right" : "left" };
}

export function useElementSize(ref: RefObject<HTMLElement | null>): { w: number; h: number } {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

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
 * on 16:9 screens) and centred horizontally. Shared by the WebGL quad, the SVG
 * fixture overlay and the captions so all three agree to the pixel.
 */
export function computeCover(stageW: number, stageH: number, aspect: number): CoverBox {
  if (stageW <= 0 || stageH <= 0) return { stageW, stageH, x: 0, y: 0, w: 0, h: 0, cover: [1, 1, 0, 0] };
  const stageAspect = stageW / stageH;
  let w: number, h: number, x: number, y: number;
  if (stageAspect >= aspect) {
    w = stageW; h = stageW / aspect; x = 0; y = 0;
  } else {
    h = stageH; w = stageH * aspect; y = 0; x = (stageW - w) / 2;
  }
  // image uv = (screen px − offset) / drawn size
  const sx = stageW / w, sy = stageH / h;
  const ox = -x / w, oy = -y / h;
  return { stageW, stageH, x, y, w, h, cover: [sx, sy, ox, oy] };
}

export function useCoverBox(ref: RefObject<HTMLElement | null>, aspect: number): CoverBox {
  const [box, setBox] = useState<CoverBox>(() => computeCover(0, 0, aspect));
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setBox((prev) => {
        const next = computeCover(Math.round(r.width), Math.round(r.height), aspect);
        return prev.stageW === next.stageW && prev.stageH === next.stageH ? prev : next;
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, aspect]);
  return box;
}

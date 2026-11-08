"use client";
/**
 * CONTRACT STUB — replaced by the hero module with the WebGL relighting layer.
 * Until then: the photo on black with CSS light pools that switch on in order.
 */
import { useEffect, useMemo, useState } from "react";
import scene from "@/lib/data/hero-scene.json";
import type { HeroScene, RoomSceneProps } from "./scene-types";
import { Glow } from "@/components/light/Glow";
import { useStore } from "@/lib/store";

const SCENE = scene as unknown as HeroScene;

export function RoomScene({ mode, progress = 0, onFullyLit, compact = false, className = "" }: RoomSceneProps) {
  const allLit = useStore((s) => s.allLit);
  const [autoT, setAutoT] = useState(0);
  const lights = useMemo(() => [...(SCENE.lights ?? [])].sort((a, b) => a.order - b.order), []);

  useEffect(() => {
    if (mode !== "auto") return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => {
      const p = Math.min(1, (t - t0) / 6000);
      setAutoT(p);
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const p = mode === "static" || allLit ? 1 : mode === "auto" ? autoT : progress;
  const litCount = lights.filter((l) => p >= l.scrollStart).length;
  useEffect(() => { if (lights.length && litCount === lights.length) onFullyLit?.(); }, [litCount, lights.length, onFullyLit]);

  return (
    <div className={`relative overflow-hidden bg-night ${className}`} style={{ aspectRatio: compact ? "16 / 10" : undefined }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SCENE.image} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: `brightness(${0.08 + 0.5 * p})` }} />
      {lights.map((l) => p >= l.scrollStart && (
        <Glow key={l.id} shape={l.shape === "halo" ? "halo" : l.shape} size={compact ? 180 : 420} x={`${l.lightPos.x * 100}%`} y={`${l.lightPos.y * 100}%`} opacity={0.9} />
      ))}
    </div>
  );
}

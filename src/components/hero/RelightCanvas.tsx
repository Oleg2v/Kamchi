"use client";
/**
 * RelightCanvas — one fullscreen quad, one ShaderMaterial, frameloop "demand".
 * Loaded with next/dynamic (ssr: false) from RoomScene. Progress never touches
 * React state here: the controller writes intensities into a Float32Array the
 * material reads, then calls invalidate().
 */
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { kelvinVec3 } from "@/lib/light/kelvin";
import { buildGeoTexture, type GeoTexture } from "./geo-texture";
import type { HeroLightController } from "./light-controller";
import { LIGHTS, SCENE } from "./light-controller";
import { MAX_LIGHTS, RELIGHT_FRAGMENT, RELIGHT_VERTEX, Z_FAR } from "./relight-shader";
import type { CoverBox } from "./use-cover-box";

const TYPE_INDEX = { pool: 0, wash: 1, spot: 2, halo: 3 } as const;
/** How far each kind of fixture throws, in scene units per unit of authored radius. */
const TYPE_REACH = { pool: 1.25, wash: 1.7, spot: 2.3, halo: 1.6 } as const;
const TYPE_SIGMA = { pool: 0.25 * 0.4, wash: 0.25 * 0.28, spot: 0.25 * 0.3, halo: 0.25 * 0.34 } as const;

export const AMBIENT = 0.03;
export const EXPOSURE = 1.1;

let geoPromise: Promise<GeoTexture> | null = null;
function useGeoTexture(): GeoTexture | null {
  const [geo, setGeo] = useState<GeoTexture | null>(null);
  useEffect(() => {
    let alive = true;
    geoPromise ??= buildGeoTexture(SCENE.depth, SCENE.aspect);
    geoPromise.then((g) => { if (alive) setGeo(g); }).catch((e) => console.error(e));
    return () => { alive = false; };
  }, []);
  return geo;
}

type Props = {
  controller: HeroLightController;
  box: CoverBox;
  onRendered?: () => void;
  preserveDrawingBuffer?: boolean;
};

function buildStaticUniforms() {
  const aspect = SCENE.aspect;
  const pos = new Float32Array(MAX_LIGHTS * 3);
  const param = new Float32Array(MAX_LIGHTS * 4);
  const dir = new Float32Array(MAX_LIGHTS * 2);
  const emit = new Float32Array(MAX_LIGHTS * 2);
  const tint = new Float32Array(MAX_LIGHTS * 3);
  const base = kelvinVec3(2700);
  LIGHTS.forEach((l, i) => {
    pos[i * 3] = l.lightPos.x * aspect;
    pos[i * 3 + 1] = l.lightPos.y;
    pos[i * 3 + 2] = (1 - l.lightPos.z) * Z_FAR;
    param[i * 4] = l.radius * TYPE_REACH[l.shape];
    param[i * 4 + 1] = TYPE_INDEX[l.shape];
    param[i * 4 + 2] = l.intensity;
    param[i * 4 + 3] = l.radius * TYPE_SIGMA[l.shape];
    dir[i * 2] = l.beamDir?.x ?? 0;
    dir[i * 2 + 1] = l.beamDir?.y ?? 1;
    emit[i * 2] = l.fixtureAnchor.x;
    emit[i * 2 + 1] = l.fixtureAnchor.y;
    const k = kelvinVec3(l.caption.kelvin);
    tint[i * 3] = k[0] / base[0];
    tint[i * 3 + 1] = k[1] / base[1];
    tint[i * 3 + 2] = k[2] / base[2];
  });
  return { pos, param, dir, emit, tint };
}

function Quad({ controller, box, onRendered, geo }: Omit<Props, "preserveDrawingBuffer"> & { geo: GeoTexture }) {
  const invalidate = useThree((s) => s.invalidate);
  const kelvin = useStore((s) => s.kelvin);
  const tex = useLoader(THREE.TextureLoader, SCENE.image);
  const meshRef = useRef<THREE.Mesh>(null);

  // Texture setup (flipY off so image-space y runs down, like the authored scene).
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
  }, [tex]);

  const material = useMemo(() => {
    const s = buildStaticUniforms();
    return new THREE.ShaderMaterial({
      vertexShader: RELIGHT_VERTEX,
      fragmentShader: RELIGHT_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTex: { value: tex },
        uGeo: { value: geo.texture },
        uAspect: { value: SCENE.aspect },
        uCover: { value: new THREE.Vector4(1, 1, 0, 0) },
        uAmbient: { value: AMBIENT },
        uKelvin: { value: new THREE.Vector3(...kelvinVec3(2700)) },
        uExposure: { value: EXPOSURE },
        uLightCount: { value: LIGHTS.length },
        uLightPos: { value: s.pos },
        uLightI: { value: controller.intensities },
        uLightParam: { value: s.param },
        uLightDir: { value: s.dir },
        uLightEmit: { value: s.emit },
        uLightTint: { value: s.tint },
      },
    });
  }, [tex, geo, controller]);

  useEffect(() => () => material.dispose(), [material]);

  // The controller asks for frames; kelvin re-tints live.
  useEffect(() => {
    controller.requestRender = () => invalidate();
    invalidate();
    return () => { controller.requestRender = () => {}; };
  }, [controller, invalidate]);

  useEffect(() => {
    (material.uniforms.uKelvin.value as THREE.Vector3).set(...kelvinVec3(kelvin));
    invalidate();
  }, [kelvin, material, invalidate]);

  useEffect(() => {
    (material.uniforms.uCover.value as THREE.Vector4).set(...box.cover);
    invalidate();
  }, [box, material, invalidate]);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    m.onAfterRender = () => onRendered?.();
    return () => { m.onAfterRender = () => {}; };
  }, [onRendered]);

  return (
    <mesh ref={meshRef} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default function RelightCanvas({ controller, box, onRendered, preserveDrawingBuffer = false }: Props) {
  const geo = useGeoTexture();
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      flat
      linear
      gl={{ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      onCreated={({ gl }) => { gl.setClearColor(0x050505, 1); }}
      aria-hidden
    >
      <Suspense fallback={null}>
        {geo && <Quad controller={controller} box={box} onRendered={onRendered} geo={geo} />}
      </Suspense>
    </Canvas>
  );
}

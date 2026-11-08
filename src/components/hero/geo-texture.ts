"use client";
/**
 * Geometry texture for the relighting shader, built once from the authored
 * 8-bit depth map: the depth is decoded to float, blurred (σ ≈ 2.5 texels, so
 * the 1/255 staircase on the walls disappears), differentiated with a wide
 * central stencil and packed as RGBA8 = (nx, ny, depth, 1). Doing this in JS
 * keeps the fragment shader to one tap and avoids float-texture extensions.
 */
import * as THREE from "three";
import { Z_FAR } from "./relight-shader";

export interface GeoTexture {
  texture: THREE.DataTexture;
  width: number;
  height: number;
}

function gaussianKernel(sigma: number): Float32Array {
  const r = Math.ceil(sigma * 3);
  const k = new Float32Array(r * 2 + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k[i + r] = v;
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  return k;
}

function blurSeparable(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const k = gaussianKernel(sigma);
  const r = (k.length - 1) / 2;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const xx = Math.min(w - 1, Math.max(0, x + i));
        acc += src[row + xx] * k[i + r];
      }
      tmp[row + x] = acc;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const yy = Math.min(h - 1, Math.max(0, y + i));
        acc += tmp[yy * w + x] * k[i + r];
      }
      out[y * w + x] = acc;
    }
  }
  return out;
}

export async function buildGeoTexture(depthUrl: string, aspect: number): Promise<GeoTexture> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`depth map failed: ${depthUrl}`));
    el.src = depthUrl;
  });
  const w = img.naturalWidth, h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, w, h).data;

  const depth = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) depth[i] = px[i * 4] / 255;
  const smooth = blurSeparable(depth, w, h, 2.5);

  // z in scene units; gradients in world units (x spans `aspect`, y spans 1)
  const out = new Uint8Array(w * h * 4);
  const S = 2; // half stencil in texels
  const dx = (2 * S) / w * aspect;
  const dy = (2 * S) / h;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const xl = Math.max(0, x - S), xr = Math.min(w - 1, x + S);
      const yu = Math.max(0, y - S), yd = Math.min(h - 1, y + S);
      const zl = (1 - smooth[y * w + xl]) * Z_FAR, zr = (1 - smooth[y * w + xr]) * Z_FAR;
      const zu = (1 - smooth[yu * w + x]) * Z_FAR, zd = (1 - smooth[yd * w + x]) * Z_FAR;
      const dzdx = (zr - zl) / (dx * ((xr - xl) / (2 * S)));
      const dzdy = (zd - zu) / (dy * ((yd - yu) / (2 * S)));
      // camera at -z: the facing normal has z < 0
      const len = Math.hypot(dzdx, dzdy, 1);
      const nx = dzdx / len, ny = dzdy / len;
      const o = (y * w + x) * 4;
      out[o] = Math.round((nx * 0.5 + 0.5) * 255);
      out[o + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[o + 2] = Math.round(smooth[y * w + x] * 255);
      out[o + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.colorSpace = THREE.NoColorSpace;
  texture.flipY = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return { texture, width: w, height: h };
}

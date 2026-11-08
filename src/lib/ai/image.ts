/** Client-side image helpers for the AI pages (no React, no server imports). */

export interface PreparedImage {
  /** data: URL (JPEG) used for display and as the "before" image. */
  dataUrl: string;
  /** Base64 payload without the data: prefix — what the routes receive. */
  base64: string;
  mediaType: "image/jpeg";
  width: number;
  height: number;
  aspect: number;
  image: HTMLImageElement;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = src;
  });
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("read failed"));
    r.readAsDataURL(file);
  });
}

export const stripDataUrl = (dataUrl: string) => dataUrl.slice(dataUrl.indexOf(",") + 1);

/** Downscale to ≤ maxPx on the long edge, re-encode as JPEG q0.85. Phone photos go from 4000 px to 1600 px here. */
export async function prepareImage(file: Blob, maxPx = 1600, quality = 0.85): Promise<PreparedImage> {
  const src = await fileToDataUrl(file);
  const img = await loadImage(src);
  const k = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * k));
  const height = Math.max(1, Math.round(img.naturalHeight * k));
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = c.toDataURL("image/jpeg", quality);
  const image = await loadImage(dataUrl);
  return { dataUrl, base64: stripDataUrl(dataUrl), mediaType: "image/jpeg", width, height, aspect: width / height, image };
}

export async function fetchAsFile(url: string, name: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
}

export function downloadText(text: string, filename: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

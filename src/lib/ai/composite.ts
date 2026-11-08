import { KELVIN_RGB } from "../light/kelvin";
import type { Fixture, Kelvin, RelightPlacement } from "../types";
import { baseFrac, isHanging, opticalFrac } from "./relight-sim";

/* ─────────────────────────────────────────────────────────────
   The relight compositor. The photo goes to night, the chosen fixture
   switches on: a warm reveal of the photo where the light lands, layered
   screen-blend gradients shaped by the fixture's photometry, a multiply
   pass that warms the surface, then the procedural fixture portrait
   rasterised from <FixtureArt/> and hung from the top edge.
   ───────────────────────────────────────────────────────────── */

export interface CompositeInput {
  photo: CanvasImageSource;
  width: number;
  height: number;
  placement: RelightPlacement;
  fixture: Fixture;
  /** The live <svg> rendered by <FixtureArt lit cast={false}/>; null draws no fixture. */
  fixtureSvg: SVGSVGElement | null;
  kelvin: Kelvin;
}

/** Serialise the inline FixtureArt SVG into a standalone document the canvas can draw (CSS vars resolved). */
export function fixtureSvgMarkup(svg: SVGSVGElement, kelvin: Kelvin): string {
  const rgb = KELVIN_RGB[kelvin].join(" ");
  let s = svg.outerHTML;
  const m = s.match(/id="([^"]+?)-pool"/);
  if (m) s = s.split(m[1]).join("fx");
  s = s.replace(/var\(--glow-rgb\)/g, rgb);
  if (!/xmlns=/.test(s)) s = s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  s = s.replace(/<svg([^>]*)\sclass="[^"]*"/, "<svg$1").replace(/<svg([^>]*)\sstyle="[^"]*"/, "<svg$1");
  s = s.replace("<svg", '<svg width="400" height="520"');
  return s;
}

function svgToImage(markup: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("fixture svg failed")); };
    img.src = url;
  });
}

type Ctx = CanvasRenderingContext2D;

function radial(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, rgb: string, stops: [number, number][]) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(Math.max(1, rx), Math.max(1, ry));
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const [o, a] of stops) g.addColorStop(o, `rgba(${rgb},${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

/** A soft cone from the fixture mouth down to the pool, blurred on a scratch canvas. */
function cone(ctx: Ctx, W: number, H: number, ax: number, ay: number, mouth: number, px: number, py: number, pr: number, rgb: string, alpha: number) {
  const t = document.createElement("canvas");
  t.width = W; t.height = H;
  const c = t.getContext("2d")!;
  c.filter = `blur(${Math.max(6, W * 0.012)}px)`;
  const g = c.createLinearGradient(0, ay, 0, py);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(0.55, `rgba(${rgb},${alpha * 0.28})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(ax - mouth, ay); c.lineTo(ax + mouth, ay); c.lineTo(px + pr, py); c.lineTo(px - pr, py); c.closePath();
  c.fill();
  ctx.drawImage(t, 0, 0);
}

export async function compositeRelight({ photo, width: W, height: H, placement: p, fixture, fixtureSvg, kelvin }: CompositeInput): Promise<HTMLCanvasElement> {
  const [kr, kg, kb] = KELVIN_RGB[kelvin];
  const rgb = `${kr},${kg},${kb}`;
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const ctx = out.getContext("2d")!;

  const ax = p.anchor.x * W, ay = p.anchor.y * H;
  const px = p.pool.cx * W, py = p.pool.cy * H, prx = p.pool.rx * W, pry = p.pool.ry * H;
  const shape = fixture.art.shape;
  const S = Math.min(W, H);

  // 1 — night: the photo darkened to ambient × 0.35 + 0.05.
  const dark = p.ambient * 0.35 + 0.05;
  ctx.drawImage(photo, 0, 0, W, H);
  ctx.fillStyle = `rgba(5,5,5,${(1 - dark).toFixed(3)})`;
  ctx.fillRect(0, 0, W, H);

  // 2 — reveal: the photo comes back where the light lands, warmed.
  {
    const t = document.createElement("canvas");
    t.width = W; t.height = H;
    const c = t.getContext("2d")!;
    c.drawImage(photo, 0, 0, W, H);
    c.globalCompositeOperation = "multiply";
    c.fillStyle = `rgba(${rgb},0.35)`;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "destination-in";
    const stops: [number, number][] = [[0, 1], [0.45, 0.75], [0.8, 0.22], [1, 0]];
    switch (shape) {
      case "wash": radial(c, ax, ay + pry * 0.4, prx * 2.4, pry * 1.9, "0,0,0", stops); break;
      case "halo": case "diffuse": radial(c, ax, ay, S * (shape === "halo" ? 0.3 : 0.42), S * (shape === "halo" ? 0.3 : 0.42), "0,0,0", stops); radial(c, px, py, prx * 1.5, pry * 1.6, "0,0,0", stops); break;
      case "spot": radial(c, px, py, prx * 1.2, pry * 1.3, "0,0,0", stops); break;
      default: radial(c, px, py, prx * 1.7, pry * 1.9, "0,0,0", stops); break;
    }
    ctx.globalAlpha = 0.92;
    ctx.drawImage(t, 0, 0);
    ctx.globalAlpha = 1;
  }

  // 3 — the cast light: screen-blend gradients, shaped by the photometry.
  ctx.globalCompositeOperation = "screen";
  const mouth = Math.max(4, p.scale * W * 0.25);
  switch (shape) {
    case "pool":
      cone(ctx, W, H, ax, ay, mouth, px, py, prx * 0.95, rgb, 0.42);
      radial(ctx, px, py, prx, pry, rgb, [[0, 0.78], [0.35, 0.4], [0.7, 0.1], [1, 0]]);
      radial(ctx, px, py, prx * 2.1, pry * 2.3, rgb, [[0, 0.22], [0.5, 0.07], [1, 0]]);
      break;
    case "cone":
      cone(ctx, W, H, ax, ay, mouth, px, py, prx * 0.85, rgb, 0.6);
      radial(ctx, px, py, prx * 0.85, pry, rgb, [[0, 0.85], [0.4, 0.35], [1, 0]]);
      radial(ctx, px, py, prx * 1.8, pry * 2, rgb, [[0, 0.18], [1, 0]]);
      break;
    case "wash":
      radial(ctx, ax, ay - pry * 0.3, prx * 1.2, pry * 1.4, rgb, [[0, 0.5], [0.4, 0.22], [1, 0]]);
      radial(ctx, ax, ay + pry * 0.9, prx * 1.6, pry * 1.6, rgb, [[0, 0.4], [0.5, 0.14], [1, 0]]);
      radial(ctx, ax, ay, prx * 3, pry * 2.6, rgb, [[0, 0.14], [1, 0]]);
      break;
    case "halo":
      radial(ctx, ax, ay, S * 0.16, S * 0.16, rgb, [[0, 0.62], [0.45, 0.22], [1, 0]]);
      radial(ctx, ax, ay, S * 0.36, S * 0.36, rgb, [[0, 0.2], [0.6, 0.06], [1, 0]]);
      radial(ctx, px, py, prx, pry, rgb, [[0, 0.3], [1, 0]]);
      break;
    case "spot":
      cone(ctx, W, H, ax, ay, mouth * 0.6, px, py, prx * 0.7, rgb, 0.5);
      radial(ctx, px, py, prx * 0.7, pry * 0.8, rgb, [[0, 0.95], [0.35, 0.45], [0.7, 0.1], [1, 0]]);
      radial(ctx, px, py, prx * 1.4, pry * 1.5, rgb, [[0, 0.15], [1, 0]]);
      break;
    case "diffuse":
    default:
      radial(ctx, ax, ay, S * 0.3, S * 0.26, rgb, [[0, 0.4], [0.5, 0.14], [1, 0]]);
      radial(ctx, px, py, prx * 1.3, pry * 1.3, rgb, [[0, 0.42], [0.5, 0.14], [1, 0]]);
      radial(ctx, px, py, prx * 2.4, pry * 2.4, rgb, [[0, 0.14], [1, 0]]);
      break;
  }
  // Bloom around the source itself.
  radial(ctx, ax, ay, p.scale * W * 0.55, p.scale * W * 0.45, rgb, [[0, 0.5], [0.4, 0.14], [1, 0]]);

  // 4 — warm the surface under the pool (multiply).
  ctx.globalCompositeOperation = "multiply";
  radial(ctx, px, py, prx * 1.3, pry * 1.4, rgb, [[0, 0.55], [1, 0]]);
  ctx.globalCompositeOperation = "source-over";

  // 5 — the fixture, hung from the top edge where it is a pendant.
  if (fixtureSvg) {
    try {
      const img = await svgToImage(fixtureSvgMarkup(fixtureSvg, kelvin));
      const boxW = p.scale * W;
      const boxH = boxW * 1.3;
      const hanging = isHanging(fixture);
      const standing = fixture.type === "floor" || fixture.type === "table" || fixture.type === "outdoor";
      const frac = opticalFrac(fixture, hanging);
      const x = ax - frac.x * boxW;
      const y = standing && fixture.type === "table" ? ay - baseFrac(fixture) * boxH : ay - frac.y * boxH;
      if (hanging) {
        ctx.strokeStyle = "rgba(90,82,72,0.95)";
        ctx.lineWidth = Math.max(1.2, W / 900);
        ctx.beginPath();
        if (fixture.art.kind === "ring" || fixture.art.kind === "bar") {
          const off = boxW * (fixture.art.kind === "ring" ? 0.5 * 0.7 * (fixture.art.width * 150 / 200) : 0.4 * Math.max(80, fixture.art.width * 150 * 1.2) / 200);
          ctx.moveTo(ax - off, 0); ctx.lineTo(ax - off, y + (10 / 260) * boxH);
          ctx.moveTo(ax + off, 0); ctx.lineTo(ax + off, y + (10 / 260) * boxH);
        } else {
          ctx.moveTo(ax, 0); ctx.lineTo(ax, y + (10 / 260) * boxH);
        }
        ctx.stroke();
      }
      ctx.drawImage(img, x, y, boxW, boxH);
    } catch {
      /* the light is drawn even if the portrait fails */
    }
  }
  return out;
}

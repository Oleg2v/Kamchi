import { simulatedDetect } from "./plan-rules";

/**
 * A procedural demo floor plan (there are no stock drawings in the demo): black walls on white
 * paper, door openings, Hebrew room labels, a dimension line and a title block. The rooms are the
 * same rectangles the simulation detects, so the overlay lands exactly on the walls.
 */
export async function drawDemoPlan(): Promise<File> {
  const W = 1600, H = 1131;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f7f5f0";
  ctx.fillRect(0, 0, W, H);

  // faint drawing grid
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const det = simulatedDetect(W / H);
  const P = (p: { x: number; y: number }) => ({ x: p.x * W, y: p.y * H });

  // walls
  ctx.lineJoin = "miter";
  for (const r of det.rooms) {
    ctx.beginPath();
    r.polygon.forEach((p, i) => { const q = P(p); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
    ctx.closePath();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 14;
    ctx.stroke();
  }
  // door openings (paper-coloured gaps + swing arcs)
  const door = (x: number, y: number, horizontal: boolean, len = 70) => {
    ctx.fillStyle = "#f7f5f0";
    if (horizontal) ctx.fillRect(x - len / 2, y - 9, len, 18); else ctx.fillRect(x - 9, y - len / 2, 18, len);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
    ctx.beginPath();
    if (horizontal) { ctx.moveTo(x - len / 2, y); ctx.lineTo(x - len / 2, y + len); ctx.arc(x - len / 2, y, len, Math.PI / 2, 0, true); }
    else { ctx.moveTo(x, y - len / 2); ctx.lineTo(x + len, y - len / 2); ctx.arc(x, y - len / 2, len, 0, Math.PI / 2); }
    ctx.stroke();
  };
  door(0.58 * W, 0.26 * H, false);
  door(0.58 * W, 0.7 * H, false);
  door(0.36 * W, 0.78 * H, false);
  door(0.2 * W, 0.92 * H, true, 90);

  // labels + areas
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  for (const r of det.rooms) {
    const xs = r.polygon.map((p) => p.x), ys = r.polygon.map((p) => p.y);
    let cx = ((Math.min(...xs) + Math.max(...xs)) / 2) * W, cy = ((Math.min(...ys) + Math.max(...ys)) / 2) * H;
    if (r.id === "living") { cx = 0.31 * W; cy = 0.36 * H; }
    ctx.font = "500 34px Heebo, Arial, sans-serif";
    ctx.fillText(r.label.he, cx, cy);
    ctx.font = "26px 'IBM Plex Mono', monospace";
    ctx.direction = "ltr";
    ctx.fillText(`${r.areaM2} m²`, cx, cy + 40);
    ctx.direction = "rtl";
  }

  // dimension line along the top
  ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
  const y = 0.05 * H;
  ctx.beginPath(); ctx.moveTo(0.06 * W, y); ctx.lineTo(0.94 * W, y); ctx.stroke();
  for (const x of [0.06, 0.56, 0.94]) { ctx.beginPath(); ctx.moveTo(x * W, y - 10); ctx.lineTo(x * W, y + 10); ctx.stroke(); }
  ctx.font = "24px 'IBM Plex Mono', monospace"; ctx.direction = "ltr";
  ctx.fillText("6.20", 0.31 * W, y - 12);
  ctx.fillText("4.70", 0.75 * W, y - 12);

  // title block
  ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
  ctx.strokeRect(0.6 * W, 0.945 * H, 0.34 * W, 0.045 * H);
  ctx.direction = "rtl"; ctx.textAlign = "right";
  ctx.font = "500 24px Heebo, Arial, sans-serif";
  ctx.fillText("תוכנית קומה · דירת 4 חדרים · קנ״מ 1:50 (הדגמה)", 0.93 * W, 0.975 * H);

  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.9));
  return new File([blob], "demo-plan.jpg", { type: "image/jpeg" });
}

#!/usr/bin/env python3
"""
make-depth.py — hand-authored "room box" depth map for the home hero photo.

Input : public/hero/room.jpg            (1920×1280, Unsplash placeholder)
Output: public/hero/room-depth.png      (960×640, 8-bit grayscale, 255 = nearest, 0 = farthest)
        public/hero/room-depth-preview.jpg  (photo | depth, side by side, for a human check)

Run:    python3 scripts/make-depth.py      (deterministic — no randomness, pure numpy + Pillow)

How the geometry was read (all numbers in 1920×1280 photo pixels)
------------------------------------------------------------------
The photo is a two-point perspective of a room corner, camera level (verticals are vertical):

  * eye level / horizon ............ y = 618   (window sill and sideboard top are flat there)
  * kitchen (left) wall ............ recedes left→right, vanishing point VP_L ≈ (1765, 620)
                                     (cabinet top/bottom, counter edge and door top all converge there)
  * window (right) wall ............ recedes right→left, vanishing point VP_R ≈ (-110, 614)
                                     (window top, sill and radiator converge there)
  * the two walls meet in a vertical corner at x = 960: floor corner (960, 848), ceiling corner (960, 214)
  * the "back wall" of the brief is therefore the far end of the kitchen wall (doorway + left print,
    x 575–960) plus the far end of the window wall (right print, x 960–1200).
  * camera height ≈ 1.2 m, ceiling ≈ 2.1 m above the camera, dining table top 0.45 m below the camera.

Depth model: for a level camera every horizontal plane gives disparity D = 1/Z ∝ (|y - horizon|) / Δh,
and a vertical wall has the disparity of the floor line directly below it (same x).  D is then mapped
to 0..255 with a mild gamma so the far half of the room keeps some range:

    value = 255 * clip((D - D_FAR) / (D_NEAR - D_FAR), 0, 1) ** GAMMA

D_FAR is the corner of the room (value 0) and D_NEAR saturates the near edge of the table (value 255).
`hero-scene.json` uses the same mapping for its lightPos.z (see depth_value() below).
"""
from __future__ import annotations

import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "hero", "room.jpg")
OUT = os.path.join(ROOT, "public", "hero", "room-depth.png")
PREVIEW = os.path.join(ROOT, "public", "hero", "room-depth-preview.jpg")

W, H = 1920, 1280          # photo size the constants below are expressed in
OUT_W, OUT_H = 960, 640    # depth map size

# ---- camera / room constants -------------------------------------------------------------------
HORIZON = 618.0            # eye level in photo px
CAM_H = 1.2                # metres, camera above floor
CEIL_H = 2.1               # metres, ceiling above camera (ceiling ≈ 3.3 m — tall old-building room)
TABLE_DH = 0.45            # metres, camera above the dining-table top (table ≈ 0.75 m)
TRAY_DH = 0.70             # metres, camera above the coffee-table tray

VP_L = (1765.0, 620.0)     # vanishing point of the kitchen (left) wall
VP_R = (-110.0, 614.0)     # vanishing point of the window (right) wall
CORNER_X = 960.0
CORNER_FLOOR_Y = 848.0
CORNER_CEIL_Y = 214.0

# disparity → grey mapping
D_FAR = (CORNER_FLOOR_Y - HORIZON) / CAM_H          # ≈ 192  → 0
D_NEAR = 820.0                                      #        → 255 (table near half, sofa arm)
GAMMA = 0.6


def line_through(p, q):
    """Return f(x) = y for the straight line through p and q."""
    (x0, y0), (x1, y1) = p, q
    m = (y1 - y0) / (x1 - x0)
    return lambda x: y0 + m * (np.asarray(x, dtype=float) - x0)


# wall / floor / ceiling junction lines
y_floor_L = line_through((CORNER_X, CORNER_FLOOR_Y), VP_L)   # kitchen-wall floor line (hidden by table)
y_ceil_L = line_through((CORNER_X, CORNER_CEIL_Y), VP_L)     # kitchen-wall ceiling line (the long diagonal)
y_floor_R = line_through((CORNER_X, CORNER_FLOOR_Y), VP_R)   # window-wall floor line
y_ceil_R = line_through((CORNER_X, CORNER_CEIL_Y), VP_R)     # window-wall ceiling line

# kitchen block: a plane parallel to the kitchen wall, ~0.5 m into the room (tall unit / base cabinets)
y_floor_K = line_through((400.0, 1090.0), VP_L)
y_cab_top = line_through((0.0, 101.0), (330.0, 199.0))       # upper-cabinet top edge
y_cab_bot = line_through((0.0, 506.0), (330.0, 528.0))       # upper-cabinet bottom edge
y_counter = line_through((0.0, 747.0), (360.0, 721.0))       # worktop edge
y_pillar_top = line_through((400.0, 189.0), (560.0, 239.0))  # tall-unit top edge
y_door_top = line_through((600.0, 396.0), (730.0, 422.0))    # doorway head
y_win_top = line_through((1380.0, 119.0), (1740.0, 0.0))     # window head
y_win_sill = line_through((1370.0, 640.0), (1820.0, 648.0))  # window sill


def depth_value(D):
    """Disparity → 0..1 (same mapping as the PNG; multiply by 255 for the grey level)."""
    t = np.clip((np.asarray(D, dtype=float) - D_FAR) / (D_NEAR - D_FAR), 0.0, 1.0)
    return t ** GAMMA


# ---- disparity of each plane, evaluated on the full pixel grid ---------------------------------
def build_disparity():
    ys, xs = np.mgrid[0:H, 0:W].astype(float)
    yc, xc = ys + 0.5, xs + 0.5

    D_floor = (yc - HORIZON) / CAM_H
    D_ceil = (HORIZON - yc) / CEIL_H
    D_wall_L = (y_floor_L(xc) - HORIZON) / CAM_H
    D_wall_R = (y_floor_R(xc) - HORIZON) / CAM_H
    D_kitchen = (y_floor_K(xc) - HORIZON) / CAM_H
    D_table = (yc - HORIZON) / TABLE_DH

    left = xc < CORNER_X
    # region masks for the box
    in_ceil = np.where(left, yc < y_ceil_L(xc), yc < y_ceil_R(xc))
    in_floor = np.where(left, yc > y_floor_L(xc), yc > y_floor_R(xc))
    D = np.where(in_ceil, D_ceil, np.where(in_floor, D_floor, np.where(left, D_wall_L, D_wall_R)))

    # kitchen block (x < 575): upper cabinets (shallower), backsplash (wall), base units + tall unit
    kx = xc < 575
    upper = kx & (xc < 355) & (yc >= y_cab_top(xc)) & (yc < y_cab_bot(xc))
    splash = kx & (xc < 355) & (yc >= y_cab_bot(xc)) & (yc < y_counter(xc))
    base = kx & (xc < 390) & (yc >= y_counter(xc)) & (yc < y_floor_K(xc))
    pillar = kx & (xc >= 355) & (yc >= y_pillar_top(xc)) & (yc < y_floor_K(xc))
    D = np.where(upper, D_wall_L + 0.6 * (D_kitchen - D_wall_L), D)
    D = np.where(splash, D_wall_L, D)
    D = np.where(base | pillar, D_kitchen, D)

    # openings: doorway shows the next room, window shows the street → farthest
    door = (xc >= 588) & (xc <= 782) & (yc >= y_door_top(xc)) & (yc <= y_floor_L(xc))
    window = (xc >= 1352) & (xc <= 1882) & (yc >= y_win_top(xc)) & (yc <= y_win_sill(xc))
    D = np.where(door | window, D_FAR - 40.0, D)

    return D, D_floor, D_table, D_wall_L, D_wall_R


def poly_mask(points, size=(W, H), ellipse=False):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    if ellipse:
        d.ellipse(points, fill=255)
    else:
        d.polygon(points, fill=255)
    return np.asarray(m, dtype=bool)


def main():
    if not os.path.exists(SRC):
        sys.exit(f"missing {SRC}")
    photo = Image.open(SRC).convert("RGB")
    if photo.size != (W, H):
        sys.exit(f"expected {W}x{H} photo, got {photo.size}")

    D, D_floor, D_table, D_wall_L, D_wall_R = build_disparity()
    ys, xs = np.mgrid[0:H, 0:W].astype(float)

    # ---- furniture blocks (nearer than the surface behind them) --------------------------------
    # white sideboard in the corner (frontal box): never farther than the wall behind it
    side = poly_mask([(790, 650), (1010, 650), (1010, 872), (790, 876)])
    D = np.where(side, np.maximum(215.0, D + 12.0), D)

    # red armchair, standing ~1 m in front of the corner
    chair = poly_mask([(1015, 708), (1140, 704), (1152, 758), (1250, 788), (1252, 886),
                       (1200, 906), (1092, 956), (1015, 956)])
    D = np.where(chair, 270.0, D)

    # black tray table top
    tray = poly_mask([1172, 868, 1340, 945], ellipse=True)
    D = np.where(tray, 405.0, D)

    # sofa against the window wall: ~0.9 m into the room, arm nearest at the bottom edge
    sofa = poly_mask([(1660, 822), (1920, 797), (1920, 1280), (1490, 1280), (1497, 1105),
                      (1540, 1000), (1600, 872)])
    D_sofa = 560.0 + (xs - 1490.0) * 0.30 + np.maximum(0.0, ys - 1000.0) * 0.6
    D = np.where(sofa, D_sofa, D)

    # transparent dining chairs beyond the table (their backs rise above the far edge)
    far_chair_l = poly_mask([(100, 826), (285, 822), (290, 960), (100, 965)])
    far_chair_r = poly_mask([(385, 792), (556, 786), (560, 900), (385, 900)])
    D = np.where(far_chair_l, 700.0, D)
    D = np.where(far_chair_r, 480.0, D)

    # ---- dining table slab (kept as a crisp edge) ----------------------------------------------
    table = poly_mask([(0, 984), (192, 941), (385, 895), (538, 861), (700, 836), (908, 849),
                       (880, 1010), (855, 1280), (0, 1280)])

    # ---- to grey, downsample, blur, composite ---------------------------------------------------
    def to_img(Dmap):
        g = (depth_value(Dmap) * 255.0 + 0.5).astype(np.uint8)
        return Image.fromarray(g, "L").resize((OUT_W, OUT_H), Image.LANCZOS)

    base_img = to_img(D).filter(ImageFilter.GaussianBlur(2.5))
    table_img = to_img(np.where(table, D_table, D))  # table on top of everything
    table_mask = Image.fromarray((table * 255).astype(np.uint8), "L") \
        .resize((OUT_W, OUT_H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.7))
    depth = Image.composite(table_img, base_img, table_mask)
    depth.save(OUT, optimize=True)

    # ---- preview: photo | depth -----------------------------------------------------------------
    small = photo.resize((OUT_W, OUT_H), Image.LANCZOS)
    prev = Image.new("RGB", (OUT_W * 2 + 8, OUT_H), (5, 5, 5))
    prev.paste(small, (0, 0))
    prev.paste(depth.convert("RGB"), (OUT_W + 8, 0))
    prev.save(PREVIEW, quality=82, optimize=True)

    # ---- report a few sample values (used to author hero-scene.json) ----------------------------
    arr = np.asarray(depth, dtype=float) / 255.0
    def at(u, v):
        return arr[min(OUT_H - 1, int(v * OUT_H)), min(OUT_W - 1, int(u * OUT_W))]
    samples = {
        "corner floor (0.50,0.66)": at(0.50, 0.66),
        "ceiling apex (0.50,0.15)": at(0.50, 0.15),
        "table far edge (0.30,0.68)": at(0.30, 0.68),
        "table centre (0.25,0.78)": at(0.25, 0.78),
        "kitchen pillar (0.27,0.30)": at(0.27, 0.30),
        "wall right of door (0.42,0.36)": at(0.42, 0.36),
        "right wall by lamp (0.63,0.46)": at(0.63, 0.46),
        "armchair (0.59,0.65)": at(0.59, 0.65),
        "sofa (0.85,0.78)": at(0.85, 0.78),
        "floor bottom centre (0.55,0.98)": at(0.55, 0.98),
    }
    print(f"wrote {OUT} ({OUT_W}x{OUT_H}, mode {depth.mode}) and {PREVIEW}")
    for k, v in samples.items():
        print(f"  {k:34s} {v:.3f}")


if __name__ == "__main__":
    main()

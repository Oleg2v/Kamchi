/**
 * Relighting shader for the hero room.
 *
 * One fullscreen quad, one material, no post chain. Per pixel:
 *   1. reconstruct a pseudo-3D position from the authored depth map
 *      (depth 1 → near, z = 0 · depth 0 → far, z = Z_FAR),
 *   2. estimate a normal from the depth gradient (camera-facing convention),
 *   3. for every light: kelvin-tinted texel × intensity × distance falloff ×
 *      soft Lambert × a cone/wash factor from the beam direction,
 *   4. add an emitter bloom at the fixture so switched-on bodies glow,
 *   5. tone-map (ACES fit) and vignette, then encode to sRGB by hand —
 *      the material writes straight to the canvas, nothing else touches it.
 */

export const MAX_LIGHTS = 8;
export const Z_FAR = 2.2;

export const RELIGHT_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const RELIGHT_FRAGMENT = /* glsl */ `
precision highp float;

#define MAX_LIGHTS ${MAX_LIGHTS}
#define Z_FAR ${Z_FAR.toFixed(2)}

uniform sampler2D uTex;      // room.jpg, sRGB → sampled linear
uniform sampler2D uGeo;      // RGBA8: normal.xy (0..1), blurred depth (255 = near), 1
uniform float uAspect;       // image aspect (1.5)
uniform vec4  uCover;        // screen uv → image uv: xy scale, zw offset
uniform float uAmbient;      // night level
uniform vec3  uKelvin;       // kelvinVec3(store.kelvin)
uniform float uExposure;
uniform int   uLightCount;

uniform vec3  uLightPos[MAX_LIGHTS];    // x·aspect, y (image space, down), z (0 near … Z_FAR far)
uniform float uLightI[MAX_LIGHTS];      // animated intensity (0 … 1.15)
uniform vec4  uLightParam[MAX_LIGHTS];  // radius, type (0 pool / 1 wash / 2 spot / 3 halo), peak, emit sigma
uniform vec2  uLightDir[MAX_LIGHTS];    // beam direction in image space
uniform vec2  uLightEmit[MAX_LIGHTS];   // fixture anchor (bloom centre), image uv
uniform vec3  uLightTint[MAX_LIGHTS];   // per-light kelvin ratio vs 2700K

varying vec2 vUv;

vec3 aces(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
vec3 toSrgb(vec3 c) {
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), c));
}

void main() {
  // screen uv (y down) → image uv under the cover mapping
  vec2 suv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 iuv = suv * uCover.xy + uCover.zw;
  if (iuv.x < 0.0 || iuv.x > 1.0 || iuv.y < 0.0 || iuv.y > 1.0) {
    gl_FragColor = vec4(0.02, 0.02, 0.02, 1.0);
    return;
  }

  vec3 tex = texture2D(uTex, iuv).rgb;
  vec4 geo = texture2D(uGeo, iuv);
  float d = geo.b;
  float z = (1.0 - d) * Z_FAR;

  // --- openings: the window shows a night street, the doorway an unlit room
  float px = iuv.x * 1920.0, py = iuv.y * 1280.0;
  float winTop  = 119.0 - (px - 1380.0) * 0.3306;
  float winSill = 640.0 + (px - 1370.0) * 0.01778;
  float inWindow = step(1352.0, px) * step(px, 1882.0) * step(winTop, py) * step(py, winSill);
  float doorTop = 396.0 + (px - 600.0) * 0.2;
  float doorFloor = 848.0 - (px - 960.0) * 0.283;
  float inDoor = step(588.0, px) * step(px, 782.0) * step(doorTop, py) * step(py, doorFloor);

  // --- normal from the (pre-blurred) depth gradient; camera at -z so the facing normal has z < 0
  vec2 nxy = geo.rg * 2.0 - 1.0;
  vec3 n = vec3(nxy, -sqrt(max(0.0, 1.0 - dot(nxy, nxy))));

  vec3 p = vec3(iuv.x * uAspect, iuv.y, z);

  // --- night ambient: a little cooler than the lamps, so warm light reads as warm
  vec3 nightTint = vec3(0.78, 0.86, 1.0);
  vec3 col = tex * uAmbient * nightTint;
  // the window: a dim, desaturated night facade; the doorway: an unlit room
  vec3 lum = vec3(dot(tex, vec3(0.3, 0.59, 0.11)));
  vec3 nightTex = mix(lum, tex, 0.4);
  col = mix(col, nightTex * vec3(0.07, 0.09, 0.15) * 0.5, inWindow);
  col = mix(col, col * 0.4, inDoor);

  float outside = max(inWindow, inDoor * 0.85);

  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;
    float I = uLightI[i];
    if (I <= 0.0005) continue;

    vec4 prm = uLightParam[i];
    float radius = prm.x;
    float type = prm.y;
    float peak = prm.z;
    float sigma = prm.w;
    vec3 lp = uLightPos[i];
    vec3 lcol = uKelvin * uLightTint[i];

    vec3 L = lp - p;
    float dist = length(L);
    vec3 Ln = L / max(dist, 1e-4);
    vec3 fromLight = -Ln;

    // distance falloff: inverse-square with a soft radius, windowed
    float r = radius;
    float att = pow((r * r) / (r * r + dist * dist), 1.35);
    att *= 1.0 - smoothstep(r * 2.0, r * 4.0, dist);

    // soft Lambert, floor 0.25
    float lam = 0.25 + 0.75 * max(dot(n, Ln), 0.0);

    // beam factor
    float dn = fromLight.y * uLightDir[i].y; // along the beam axis (image y)
    float cone = 1.0;
    if (type < 0.5) {            // pool: wide downward
      cone = 0.14 + 0.86 * smoothstep(-0.05, 0.62, dn);
    } else if (type < 1.5) {     // wash: up and down the wall
      float v = abs(fromLight.y);
      cone = 0.08 + 0.92 * smoothstep(0.28, 0.9, v);
      cone *= (dn > 0.0) ? 1.0 : 0.65;
    } else if (type < 2.5) {     // spot: tight downward beam
      cone = 0.04 + 0.96 * pow(smoothstep(0.5, 0.97, dn), 1.4);
    } else {                     // halo: the shade dims straight up / down a touch
      cone = 0.82 + 0.18 * (1.0 - abs(fromLight.y));
    }

    float lit = I * peak * att * lam * cone * (1.0 - 0.96 * outside);
    col += tex * lcol * lit;

    // very broad bounce so a lit room lifts a little everywhere
    float bounce = (r * r * 9.0) / (r * r * 9.0 + dist * dist);
    col += tex * lcol * I * 0.02 * bounce * (1.0 - 0.95 * outside);

    // emitter bloom: a tight core plus a soft halo at the fixture
    vec2 e = (iuv - uLightEmit[i]) * vec2(uAspect, 1.0);
    float e2 = dot(e, e);
    float core = exp(-e2 / (2.0 * sigma * sigma));
    float halo = exp(-e2 / (2.0 * sigma * sigma * 9.0));
    float bloomK = type > 2.5 ? 0.45 : 1.0;
    col += lcol * I * (core * 1.5 + halo * 0.14) * bloomK;
  }

  // tone map + gentle vignette
  col = aces(col * uExposure);
  float vig = 1.0 - 0.32 * smoothstep(0.45, 1.25, length((suv - 0.5) * vec2(1.25, 1.0)) * 1.5);
  col *= vig;

  gl_FragColor = vec4(toSrgb(col), 1.0);
}
`;

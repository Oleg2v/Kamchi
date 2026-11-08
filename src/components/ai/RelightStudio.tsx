"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AiNotice } from "./AiNotice";
import { AiSkeleton } from "./AiSkeleton";
import { BeforeAfter } from "./BeforeAfter";
import { FixturePicker } from "./FixturePicker";
import { ProjectRoomDialog, StudioDialog } from "./pickers";
import { ToastStack, useToasts } from "./Toast";
import { FixtureArt } from "@/components/light/FixtureArt";
import { KelvinToggle } from "@/components/light/KelvinToggle";
import { SwitchOn } from "@/components/light/SwitchOn";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { compositeRelight } from "@/lib/ai/composite";
import { envelope } from "@/lib/ai/envelope";
import { downloadDataUrl, fetchAsFile, prepareImage, type PreparedImage } from "@/lib/ai/image";
import { analyzePhoto } from "@/lib/ai/relight-analyze";
import { isHanging, placementFromAnalysis, type PhotoAnalysis } from "@/lib/ai/relight-sim";
import { getFixture, getStudio } from "@/lib/data";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLang, useTx } from "@/lib/i18n";
import { BETA, SIMULATION } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import { sleep } from "@/lib/utils";
import type { AiEnvelope, RelightPlacement } from "@/lib/types";

const CAPTIONS = [
  { he: "מזהה את המשטח…", en: "Finding the surface…" },
  { he: "מודד גובה תקרה…", en: "Measuring the ceiling…" },
  { he: "מחשב את פיזור האור…", en: "Computing the light distribution…" },
];

type Phase = "idle" | "working" | "done" | "error";
interface Result { envelope: AiEnvelope<RelightPlacement>; placement: RelightPlacement; after: string; ms: number }

const DEFAULT_FIXTURE = "vibia-nube";

export function RelightStudio() {
  const t = useTx();
  const lang = useLang();
  const reduced = useReducedMotion();
  const sp = useSearchParams();
  const kelvin = useStore((s) => s.kelvin);
  const saveRelight = useStore((s) => s.saveRelight);
  const addItemToRoom = useStore((s) => s.addItemToRoom);
  const { toasts, push } = useToasts();

  const [fixtureId, setFixtureId] = useState(() => (getFixture(sp.get("fixture") ?? "") ? sp.get("fixture")! : DEFAULT_FIXTURE));
  const fixture = getFixture(fixtureId) ?? getFixture(DEFAULT_FIXTURE)!;
  const [photo, setPhoto] = useState<PreparedImage | null>(null);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const artHost = useRef<HTMLDivElement>(null);
  const runId = useRef(0);

  const acceptFile = useCallback(async (file: File | null | undefined) => {
    if (!file || !file.type.startsWith("image/")) { push(t({ he: "אפשר להעלות רק קובץ תמונה.", en: "Only image files can be uploaded." })); return; }
    setLoadingPhoto(true);
    try {
      const prepared = await prepareImage(file);
      setPhoto(prepared);
      setAnalysis(null);
      setResult(null);
      setPhase("idle");
    } catch {
      push(t({ he: "לא הצלחנו לקרוא את התמונה.", en: "The image could not be read." }));
    } finally {
      setLoadingPhoto(false);
    }
  }, [push, t]);

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragOver(false); void acceptFile(e.dataTransfer.files?.[0]); };
  const onPick = (e: ChangeEvent<HTMLInputElement>) => { void acceptFile(e.target.files?.[0]); e.target.value = ""; };
  const loadSample = async () => { void acceptFile(await fetchAsFile("/hero/room.jpg", "room.jpg")); };

  const composite = useCallback(async (p: PreparedImage, placement: RelightPlacement) => {
    const svg = artHost.current?.querySelector("svg") ?? null;
    const canvas = await compositeRelight({ photo: p.image, width: p.width, height: p.height, placement, fixture, fixtureSvg: svg, kelvin });
    return canvas.toDataURL("image/png");
  }, [fixture, kelvin]);

  const run = async () => {
    if (!photo || phase === "working") return;
    const id = ++runId.current;
    const t0 = performance.now();
    setPhase("working");
    setResult(null);
    try {
      const minWait = sleep(reduced ? 0 : 2300);
      const a = analysis ?? analyzePhoto(photo.image, photo.width, photo.height);
      setAnalysis(a);
      let env: AiEnvelope<RelightPlacement>;
      try {
        const res = await fetch("/api/ai/relight", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ image: photo.base64, mediaType: photo.mediaType, fixtureId: fixture.id, aspect: photo.aspect }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        env = (await res.json()) as AiEnvelope<RelightPlacement>;
      } catch {
        // Offline / route failure: the simulation runs entirely in the browser, labelled as such.
        env = envelope(placementFromAnalysis(a, fixture), "simulation", Math.round(performance.now() - t0));
      }
      // Pixels beat templates: when the server could not see the photo, use the client analysis.
      const placement = env.source === "simulation" ? placementFromAnalysis(a, fixture) : env.data;
      const after = await composite(photo, placement);
      await minWait;
      if (id !== runId.current) return;
      setResult({ envelope: env, placement, after, ms: Math.round(performance.now() - t0) });
      setPhase("done");
    } catch {
      if (id !== runId.current) return;
      setPhase("error");
    }
  };

  // Kelvin is a live control: the composite follows it.
  useEffect(() => {
    if (!result || !photo || phase !== "done") return;
    let alive = true;
    composite(photo, result.placement).then((after) => { if (alive) setResult((r) => (r ? { ...r, after } : r)); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelvin]);

  const sendToDesigner = (studioId: string) => {
    if (!result) return;
    saveRelight({ fixtureId: fixture.id, source: result.envelope.source, sentToDesigner: true });
    const st = getStudio(studioId);
    push(t({ he: `ההדמיה נשלחה ל${st?.name ?? "סטודיו"}.`, en: `Sent to ${st?.nameEn ?? "the studio"}.` }));
  };
  const addToProject = (projectId: string, roomId?: string) => {
    if (!roomId) return;
    addItemToRoom(projectId, roomId, fixture.id, 1, t({ he: "מתוך הדמיית ״תאירו לי את הסלון״", en: "From the relight simulation" }));
    if (result) saveRelight({ fixtureId: fixture.id, source: result.envelope.source });
    push(t({ he: `${fixture.nameHe} נוסף לפרויקט.`, en: `${fixture.name} added to the project.` }));
  };

  const name = lang === "he" ? fixture.nameHe : fixture.name;
  const stageBusy = phase === "working";

  return (
    <>
      <PageHeader
        eyebrow={`${t(BETA)} · ${t(SIMULATION)}`}
        title={t({ he: "תאירו לי את הסלון", en: "Light my living room" })}
        lede={t({
          he: "מעלים תמונה מהטלפון, בוחרים גוף תאורה מהקטלוג — והחדר כבה ונדלק מחדש רק ממנו. ההדמיה מחשבת איפה הגוף יושב, איפה האור נופל ובאיזו טמפרטורת צבע.",
          en: "Upload a phone photo, pick a fixture from the catalogue — the room goes dark and lights up again from that fixture alone. The simulation works out where it sits, where the light lands and at which colour temperature.",
        })}
        beta
        betaLabel={t(BETA)}
      />

      <section className="container-x pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-14">
          {/* ── Stage ── */}
          <div className="min-w-0">
            {stageBusy && photo && <AiSkeleton image={photo.dataUrl} aspect={photo.aspect} captions={CAPTIONS} label={{ he: "מחשב הדמיה", en: "Computing the simulation" }} />}

            {phase === "done" && result && photo && (
              <SwitchOn on className="flex flex-col gap-4">
                <BeforeAfter before={photo.dataUrl} after={result.after} aspect={photo.aspect} alt={{ he: `החדר עם ${fixture.nameHe}`, en: `The room with ${fixture.name}` }} />
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                  <p className="max-w-prose text-[0.95rem] leading-relaxed text-paper">{t(result.placement.rationale)}</p>
                  <dl className="grid grid-cols-3 gap-x-5 gap-y-1 font-mono text-[0.7rem] tracking-wider text-muted md:text-end" dir="ltr">
                    <dt className="sr-only">ceiling</dt><dd className="text-paper">{result.placement.ceilingM.toFixed(1)} m</dd>
                    <dt className="sr-only">kelvin</dt><dd className="text-paper">{kelvin}K</dd>
                    <dt className="sr-only">time</dt><dd className="text-glow">{result.ms} ms</dd>
                    <dd className="col-span-3 text-[0.62rem]">{t({ he: "תקרה · טמפרטורת צבע · זמן חישוב", en: "ceiling · colour temp · compute time" })}</dd>
                  </dl>
                </div>
                <AiNotice envelope={result.envelope} ms={result.ms} />
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary" onClick={() => downloadDataUrl(result.after, `kamchi-relight-${fixture.slug}.png`)}>{t({ he: "הורדה", en: "Download" })}</button>
                  <button type="button" className="btn btn-brass" onClick={() => setStudioOpen(true)}>{t({ he: "שלחו למעצב", en: "Send to a designer" })}</button>
                  <button type="button" className="btn" onClick={() => setProjectOpen(true)}>{t({ he: "להוסיף לפרויקט", en: "Add to a project" })}</button>
                  <TransitionLink href={`/catalog/${fixture.slug}`} className="btn">{t({ he: "לקטלוג", en: "Catalogue page" })}</TransitionLink>
                  <button type="button" className="btn btn-sm ms-auto" onClick={() => { setPhase("idle"); setResult(null); }}>{t({ he: "גוף אחר על אותה תמונה", en: "Another fixture, same photo" })}</button>
                </div>
              </SwitchOn>
            )}

            {(phase === "idle" || phase === "error") && (
              photo ? (
                <div className="relative overflow-hidden border hairline" style={{ aspectRatio: photo.aspect }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.dataUrl} alt={t({ he: "התמונה שהועלתה", en: "The uploaded photo" })} className="h-full w-full object-cover" style={{ filter: "brightness(0.5) saturate(0.85)" }} />
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-night/90 to-transparent p-4 md:p-5">
                    <div>
                      <p className="font-mono text-[0.68rem] tracking-wider text-brass-light" dir="ltr">{photo.width} × {photo.height} · JPEG</p>
                      <p className="mt-1 text-sm text-paper">
                        {phase === "error"
                          ? t({ he: "משהו השתבש בחישוב. נסו שוב.", en: "Something went wrong. Try again." })
                          : t({ he: "התמונה מוכנה. בחרו גוף תאורה והדליקו.", en: "Photo ready. Pick a fixture and switch it on." })}
                      </p>
                    </div>
                    <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>{t({ he: "החלפת תמונה", en: "Change photo" })}</button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`relative grid place-items-center border border-dashed p-8 text-center transition-colors md:p-12 ${dragOver ? "border-glow shadow-glow" : "hairline"}`}
                  style={{ aspectRatio: 3 / 2 }}
                >
                  <SwitchOn glow="pool" glowSize={560} glowOffset={{ y: "92%" }} className="flex flex-col items-center gap-5">
                    <div className="w-28 md:w-36"><FixtureArt fixture={fixture} lit={dragOver} suspension /></div>
                    <p className="font-display text-2xl leading-tight text-paper md:text-3xl">{t({ he: "גררו לכאן תמונה של החדר", en: "Drop a photo of the room here" })}</p>
                    <p className="max-w-sm text-sm text-muted">{t({ he: "תמונה מהטלפון מספיקה. התמונה מוקטנת ל־1600 פיקסל במכשיר שלכם לפני השליחה.", en: "A phone photo is enough. It is downscaled to 1600 px on your device before upload." })}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={loadingPhoto}>{t({ he: "בחירת תמונה", en: "Choose a photo" })}</button>
                      <button type="button" className="btn" onClick={() => void loadSample()} disabled={loadingPhoto}>{t({ he: "דוגמה", en: "Sample" })}</button>
                    </div>
                  </SwitchOn>
                </div>
              )
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={onPick} aria-label={t({ he: "העלאת תמונה", en: "Upload a photo" })} />
          </div>

          {/* ── Steps ── */}
          <aside className="min-w-0 lg:border-s lg:hairline lg:ps-10" aria-label={t({ he: "שלבי ההדמיה", en: "Simulation steps" })}>
            <ol className="flex flex-col gap-8">
              <li>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="eyebrow">01 · {t({ he: "תמונה", en: "Photo" })}</h2>
                  <span className="font-mono text-[0.68rem] tracking-wider text-muted" dir="ltr">{photo ? `${photo.width}×${photo.height}` : "—"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={loadingPhoto || stageBusy}>{photo ? t({ he: "תמונה אחרת", en: "Another photo" }) : t({ he: "בחירת תמונה", en: "Choose a photo" })}</button>
                  <button type="button" className="btn btn-sm" onClick={() => void loadSample()} disabled={loadingPhoto || stageBusy}>{t({ he: "דוגמה", en: "Sample" })}</button>
                  {loadingPhoto && <span className="self-center font-mono text-[0.68rem] tracking-wider text-brass-light">{t({ he: "מקטין…", en: "Downscaling…" })}</span>}
                </div>
              </li>
              <li>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="eyebrow">02 · {t({ he: "גוף תאורה", en: "Fixture" })}</h2>
                  <span className="truncate text-sm text-glow">{name}</span>
                </div>
                <div className="mt-3"><FixturePicker value={fixtureId} onChange={(id) => { setFixtureId(id); if (phase === "done") setPhase("idle"); }} /></div>
              </li>
              <li>
                <h2 className="eyebrow">03 · {t({ he: "הדלקה", en: "Switch on" })}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <KelvinToggle />
                  <button type="button" className="btn btn-primary flex-1" onClick={() => void run()} disabled={!photo || stageBusy || loadingPhoto} aria-busy={stageBusy}>
                    {stageBusy ? t({ he: "מחשב…", en: "Computing…" }) : t({ he: `הדליקו את ${name}`, en: `Switch on ${name}` })}
                  </button>
                </div>
                <p className="mt-3 text-[0.8rem] leading-relaxed text-muted">
                  {t({ he: "החישוב נעשה בדפדפן ובשרת; התוצאה מגיעה תוך פחות מ־15 שניות. ההדמיה אינה תחליף לתכנון תאורה.", en: "Computed in the browser and on the server; the result arrives in under 15 seconds. A simulation, not a lighting design." })}
                </p>
              </li>
            </ol>
          </aside>
        </div>
      </section>

      {/* Offscreen portrait that the compositor rasterises. */}
      <div ref={artHost} aria-hidden className="pointer-events-none fixed top-0 opacity-0" style={{ insetInlineStart: "-9999px", width: 200, height: 260 }}>
        <FixtureArt key={fixture.id} fixture={fixture} lit cast={false} suspension={isHanging(fixture)} />
      </div>

      <StudioDialog open={studioOpen} onClose={() => setStudioOpen(false)} title={t({ he: "שלחו למעצב", en: "Send to a designer" })} cta={t({ he: "שליחה", en: "Send" })} onPick={sendToDesigner} />
      <ProjectRoomDialog open={projectOpen} onClose={() => setProjectOpen(false)} title={t({ he: "להוסיף לפרויקט", en: "Add to a project" })} cta={t({ he: "הוספה", en: "Add" })} onPick={addToProject} />
      <ToastStack toasts={toasts} />
    </>
  );
}

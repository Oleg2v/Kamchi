"use client";
import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { AiNotice } from "./AiNotice";
import { AiSkeleton } from "./AiSkeleton";
import { PlanOverlay } from "./PlanOverlay";
import { ShoppingList } from "./ShoppingList";
import { ProjectRoomDialog, StudioDialog } from "./pickers";
import { ToastStack, useToasts } from "./Toast";
import { SwitchOn } from "@/components/light/SwitchOn";
import { PageHeader } from "@/components/ui/PageHeader";
import { planCsv } from "@/lib/ai/csv";
import { envelope } from "@/lib/ai/envelope";
import { downloadText, fileToDataUrl, prepareImage, stripDataUrl, type PreparedImage } from "@/lib/ai/image";
import { drawDemoPlan } from "@/lib/ai/plan-demo";
import { buildLightingPlan, LUX_RANGE, simulatedDetect } from "@/lib/ai/plan-rules";
import { getStudio } from "@/lib/data";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLang, useTx } from "@/lib/i18n";
import { BETA, SIMULATION, SPACE_LABEL } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import { sleep } from "@/lib/utils";
import { SPACES, type AiEnvelope, type LightingPlan } from "@/lib/types";

const CAPTIONS = [
  { he: "מזהה חדרים…", en: "Detecting rooms…" },
  { he: "מחשב לוקס…", en: "Computing lux…" },
  { he: "בוחר גופי תאורה…", en: "Choosing fixtures…" },
];

type Source = { kind: "image"; prepared: PreparedImage; name: string } | { kind: "pdf"; base64: string; name: string; aspect: number };
type Phase = "idle" | "working" | "done" | "error";
interface Result { envelope: AiEnvelope<LightingPlan>; plan: LightingPlan; ms: number }

export function PlanStudio() {
  const t = useTx();
  const lang = useLang();
  const reduced = useReducedMotion();
  const logEvent = useStore((s) => s.logEvent);
  const attachPlan = useStore((s) => s.attachPlan);
  const savePlan = useStore((s) => s.savePlan);
  const { toasts, push } = useToasts();

  const [source, setSource] = useState<Source | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [night, setNight] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const runId = useRef(0);

  const acceptFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    setLoading(true);
    try {
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        const dataUrl = await fileToDataUrl(file);
        setSource({ kind: "pdf", base64: stripDataUrl(dataUrl), name: file.name, aspect: 1.414 });
      } else if (file.type.startsWith("image/")) {
        setSource({ kind: "image", prepared: await prepareImage(file, 1800, 0.88), name: file.name });
      } else {
        push(t({ he: "אפשר להעלות תמונה או PDF.", en: "Upload an image or a PDF." }));
        return;
      }
      setResult(null);
      setPhase("idle");
    } catch {
      push(t({ he: "לא הצלחנו לקרוא את הקובץ.", en: "The file could not be read." }));
    } finally {
      setLoading(false);
    }
  }, [push, t]);

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragOver(false); void acceptFile(e.dataTransfer.files?.[0]); };
  const onPick = (e: ChangeEvent<HTMLInputElement>) => { void acceptFile(e.target.files?.[0]); e.target.value = ""; };
  const loadSample = async () => { void acceptFile(await drawDemoPlan()); };

  const run = async () => {
    if (!source || phase === "working") return;
    const id = ++runId.current;
    const t0 = performance.now();
    setPhase("working");
    setResult(null);
    const aspect = source.kind === "image" ? source.prepared.aspect : source.aspect;
    try {
      const minWait = sleep(reduced ? 0 : 2400);
      const body = source.kind === "image"
        ? { image: source.prepared.base64, mediaType: source.prepared.mediaType, aspect }
        : { document: source.base64, mediaType: "application/pdf", aspect };
      let env: AiEnvelope<LightingPlan>;
      try {
        const res = await fetch("/api/ai/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        env = (await res.json()) as AiEnvelope<LightingPlan>;
      } catch {
        env = envelope(buildLightingPlan(simulatedDetect(aspect), false), "simulation", Math.round(performance.now() - t0));
      }
      await minWait;
      if (id !== runId.current) return;
      setResult({ envelope: env, plan: env.data, ms: Math.round(performance.now() - t0) });
      setPhase("done");
    } catch {
      if (id !== runId.current) return;
      setPhase("error");
    }
  };

  const sendToConsultant = (studioId: string) => {
    if (!result) return;
    const st = getStudio(studioId);
    savePlan(result.plan);
    logEvent({
      actor: "designer", type: "ai.plan", studioId, payload: { planId: result.plan.id, rooms: result.plan.rooms.length, totalsIls: result.plan.totalsIls, source: result.envelope.source },
      title: { he: `תוכנית תאורה נשלחה ליועץ — ${result.plan.rooms.length} חדרים · ₪${result.plan.totalsIls.toLocaleString("he-IL")}`, en: `Lighting plan sent to the consultant — ${result.plan.rooms.length} rooms · ₪${result.plan.totalsIls.toLocaleString("en-IL")}` },
    });
    push(t({ he: `התוכנית נשלחה ליועץ התאורה של קמחי עבור ${st?.name ?? "הסטודיו"}.`, en: `Plan sent to Kamchi's lighting consultant for ${st?.nameEn ?? "the studio"}.` }));
  };
  const attachToProject = (projectId: string) => {
    if (!result) return;
    savePlan(result.plan);
    attachPlan(projectId, result.plan);
    push(t({ he: "התוכנית צורפה לפרויקט.", en: "Plan attached to the project." }));
  };

  const busy = phase === "working";
  const aspect = source ? (source.kind === "image" ? source.prepared.aspect : source.aspect) : 1.414;
  const image = source?.kind === "image" ? source.prepared.dataUrl : null;
  const sheetTitle = { he: source?.name ? `תוכנית: ${source.name}` : "תוכנית", en: source?.name ? `Plan: ${source.name}` : "Plan" };

  return (
    <>
      <PageHeader
        eyebrow={`${t(BETA)} · ${t(SIMULATION)}`}
        title={t({ he: "תוכנית תאורה מתוכנית דירה", en: "A lighting plan from a floor plan" })}
        lede={t({
          he: "מעלים תוכנית — תמונה או PDF. נזהה את החדרים, נקבע יעד לוקס לכל חלל ונציע גופי תאורה מהקטלוג בשלוש שכבות: תאורה כללית, אור משימה והדגשה. בסוף: תוכנית מסומנת ורשימת רכש.",
          en: "Upload a plan — image or PDF. We detect the rooms, set a lux target per space and propose catalogue fixtures in three layers: ambient, task and accent. You get an annotated plan and a bill of materials.",
        })}
        beta
        betaLabel={t(BETA)}
      />

      <section className="container-x pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-14">
          <div className="min-w-0">
            {busy && <AiSkeleton image={image} aspect={aspect} captions={CAPTIONS} label={{ he: "מחשב תוכנית תאורה", en: "Computing the lighting plan" }} />}

            {phase === "done" && result && (
              <div data-plan-result data-source={result.envelope.source} data-rooms={result.plan.rooms.length} data-total={result.plan.totalsIls} data-ms={result.ms}>
                <SwitchOn on className="flex flex-col gap-4">
                  <PlanOverlay plan={result.plan} image={image} aspect={aspect} night={night} title={sheetTitle} />
                  <div className="flex flex-wrap items-center gap-3">
                    {image && <button type="button" className="chip" aria-pressed={night} onClick={() => setNight((v) => !v)}>{t({ he: "תצוגת לילה", en: "Night view" })}</button>}
                    <p className="flex-1 basis-64 text-[0.95rem] leading-relaxed text-paper">{t(result.plan.summary)}</p>
                  </div>
                  <AiNotice envelope={result.envelope} ms={result.ms} />
                </SwitchOn>
              </div>
            )}

            {(phase === "idle" || phase === "error") && (
              source ? (
                <div className="relative overflow-hidden border hairline bg-night" style={{ aspectRatio: aspect }}>
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={t(sheetTitle)} className="h-full w-full object-contain" style={{ filter: "invert(1) hue-rotate(180deg) brightness(0.5) sepia(0.25)", opacity: 0.75 }} />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <div className="text-center">
                        <p className="font-mono text-[0.72rem] tracking-widest text-brass-light">PDF</p>
                        <p className="mt-2 font-display text-2xl text-paper">{source.name}</p>
                        <p className="mt-2 max-w-xs text-sm text-muted">{t({ he: "המסמך נשלח כפי שהוא למודל; בהדמיה נציג גיליון כהה עם החדרים שזוהו.", en: "The document goes to the model as is; in simulation a dark sheet shows the detected rooms." })}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-night/90 to-transparent p-4 md:p-5">
                    <div>
                      <p className="font-mono text-[0.68rem] tracking-wider text-brass-light" dir="ltr">{source.kind === "image" ? `${source.prepared.width} × ${source.prepared.height} · JPEG` : "PDF"}</p>
                      <p className="mt-1 text-sm text-paper">{phase === "error" ? t({ he: "משהו השתבש בחישוב. נסו שוב.", en: "Something went wrong. Try again." }) : t({ he: "התוכנית מוכנה. אפשר לחשב.", en: "Plan ready. Compute when you like." })}</p>
                    </div>
                    <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>{t({ he: "קובץ אחר", en: "Another file" })}</button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`relative grid place-items-center border border-dashed p-8 text-center transition-colors md:p-12 ${dragOver ? "border-glow shadow-glow" : "hairline"}`}
                  style={{ aspectRatio: 1.414 }}
                >
                  <SwitchOn glow="diffuse" glowSize={520} glowOffset={{ y: "40%" }} className="flex flex-col items-center gap-5">
                    <svg aria-hidden viewBox="0 0 120 84" className="w-28 text-paper/70 md:w-36">
                      <rect x="2" y="2" width="116" height="80" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M62 2v46H2M62 36h56M62 48v34M90 48v34" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="32" cy="24" r="2.5" fill="rgb(var(--glow-rgb))" />
                      <circle cx="90" cy="19" r="2.5" fill="none" stroke="rgb(var(--glow-rgb))" strokeWidth="1.2" />
                      <path d="M30 64 l3 3 -3 3 -3 -3z" fill="none" stroke="rgb(var(--glow-rgb))" strokeWidth="1.2" />
                    </svg>
                    <p className="font-display text-2xl leading-tight text-paper md:text-3xl">{t({ he: "גררו לכאן תוכנית דירה", en: "Drop a floor plan here" })}</p>
                    <p className="max-w-sm text-sm text-muted">{t({ he: "תמונה (JPEG/PNG) או PDF של תוכנית אדריכלית. ללא קובץ? יש תוכנית לדוגמה.", en: "An image (JPEG/PNG) or PDF of an architectural plan. No file at hand? Try the sample plan." })}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={loading}>{t({ he: "בחירת קובץ", en: "Choose a file" })}</button>
                      <button type="button" className="btn" onClick={() => void loadSample()} disabled={loading}>{t({ he: "דוגמה", en: "Sample" })}</button>
                    </div>
                  </SwitchOn>
                </div>
              )
            )}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="sr-only" tabIndex={-1} onChange={onPick} aria-label={t({ he: "העלאת תוכנית", en: "Upload a plan" })} />
          </div>

          <aside className="min-w-0 lg:border-s lg:hairline lg:ps-10" aria-label={t({ he: "שלבי התוכנית", en: "Plan steps" })}>
            <ol className="flex flex-col gap-8">
              <li>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="eyebrow">01 · {t({ he: "תוכנית", en: "Plan" })}</h2>
                  <span className="max-w-[12rem] truncate font-mono text-[0.68rem] tracking-wider text-muted" dir="ltr">{source?.name ?? "—"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={loading || busy}>{t({ he: "בחירת קובץ", en: "Choose a file" })}</button>
                  <button type="button" className="btn btn-sm" onClick={() => void loadSample()} disabled={loading || busy}>{t({ he: "דוגמה", en: "Sample" })}</button>
                  {loading && <span className="self-center font-mono text-[0.68rem] tracking-wider text-brass-light">{t({ he: "קורא…", en: "Reading…" })}</span>}
                </div>
              </li>
              <li>
                <h2 className="eyebrow">02 · {t({ he: "יעדי לוקס", en: "Lux targets" })}</h2>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[0.82rem]">
                  {SPACES.filter((s) => s !== "commercial" && s !== "outdoor").map((s) => (
                    <div key={s} className="flex items-baseline justify-between gap-2 border-b hairline pb-1">
                      <dt className="text-muted">{t(SPACE_LABEL[s])}</dt>
                      <dd className="font-mono text-[0.72rem] text-paper" dir="ltr">{LUX_RANGE[s][0]}–{LUX_RANGE[s][1]} lx</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[0.8rem] leading-relaxed text-muted">{t({ he: "כמות ≈ לוקס × מ״ר ÷ (לומן × 0.5 מקדם ניצול), לפחות יחידה אחת. שלוש שכבות: כללי, משימה, הדגשה.", en: "Quantity ≈ lux × m² ÷ (lumens × 0.5 utilisation), at least one. Three layers: ambient, task, accent." })}</p>
              </li>
              <li>
                <h2 className="eyebrow">03 · {t({ he: "חישוב", en: "Compute" })}</h2>
                <button type="button" className="btn btn-primary mt-3 w-full" onClick={() => void run()} disabled={!source || busy || loading} aria-busy={busy}>
                  {busy ? t({ he: "מחשב…", en: "Computing…" }) : t({ he: "חשבו תוכנית תאורה", en: "Compute the lighting plan" })}
                </button>
              </li>
            </ol>
          </aside>
        </div>

        {phase === "done" && result && (
          <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-14">
            <div className="min-w-0">
              <h2 className="eyebrow mb-5">{t({ he: "רשימת רכש", en: "Bill of materials" })}</h2>
              <ShoppingList plan={result.plan} />
            </div>
            <aside className="min-w-0 lg:border-s lg:hairline lg:ps-10">
              <h2 className="eyebrow mb-4">{t({ he: "מה עושים עם זה", en: "Next steps" })}</h2>
              <div className="flex flex-col gap-2">
                <button type="button" className="btn btn-brass" onClick={() => setStudioOpen(true)}>{t({ he: "שלחו ליועץ תאורה", en: "Send to a lighting consultant" })}</button>
                <button type="button" className="btn" onClick={() => setProjectOpen(true)}>{t({ he: "צרפו לפרויקט", en: "Attach to a project" })}</button>
                <button type="button" className="btn" onClick={() => downloadText(planCsv(result.plan, lang), `kamchi-plan-${result.plan.id}.csv`, "text/csv;charset=utf-8")}>{t({ he: "הורדת רשימה (CSV)", en: "Download list (CSV)" })}</button>
                <button type="button" className="btn btn-sm mt-2" onClick={() => { setPhase("idle"); setResult(null); }}>{t({ he: "תוכנית אחרת", en: "Another plan" })}</button>
              </div>
              <p className="mt-5 text-[0.8rem] leading-relaxed text-muted">{t({ he: "יועץ התאורה של קמחי בודק את החלוקה לשכבות, את גובה התלייה ואת זמני האספקה מול הפרויקט, ומחזיר הצעת מחיר דרך פורטל המעצבים.", en: "Kamchi's lighting consultant checks the layering, hanging heights and lead times against the project and returns a quote through the designer portal." })}</p>
            </aside>
          </div>
        )}
      </section>

      <StudioDialog open={studioOpen} onClose={() => setStudioOpen(false)} title={t({ he: "שלחו ליועץ תאורה", en: "Send to a lighting consultant" })} cta={t({ he: "שליחה", en: "Send" })} onPick={sendToConsultant} />
      <ProjectRoomDialog open={projectOpen} onClose={() => setProjectOpen(false)} title={t({ he: "צרפו לפרויקט", en: "Attach to a project" })} cta={t({ he: "צירוף", en: "Attach" })} needRoom={false} onPick={attachToProject} />
      <ToastStack toasts={toasts} />
    </>
  );
}

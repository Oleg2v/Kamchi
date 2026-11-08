"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { AiNotice } from "./AiNotice";
import { ProductCard } from "./ProductCard";
import { SwitchOn } from "@/components/light/SwitchOn";
import { PageHeader } from "@/components/ui/PageHeader";
import { simulateConsultant } from "@/lib/ai/consultant-sim";
import { envelope } from "@/lib/ai/envelope";
import { getFixture } from "@/lib/data";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { useLang, useTx } from "@/lib/i18n";
import { BETA, SIMULATION } from "@/lib/i18n/common";
import { useStore } from "@/lib/store";
import type { AiEnvelope, ConsultantAnswer } from "@/lib/types";

const SUGGESTIONS: { he: string; en: string }[] = [
  { he: "איזה גוף תאורה מתאים לחדר רחצה עם תקרה נמוכה?", en: "Which fixture suits a bathroom with a low ceiling?" },
  { he: "מה ההבדל בין DALI לעמעום פאזה?", en: "What is the difference between DALI and phase dimming?" },
  { he: "תלוי מעל שולחן אוכל באורך 2.4 מ׳, אור חם", en: "A pendant over a 2.4 m dining table, warm light" },
  { he: "שקועים לסלון 30 מ״ר, 3000K", en: "Recessed for a 30 m² living room, 3000K" },
];

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "consultant"; pending: true }
  | { id: number; role: "consultant"; pending?: false; answer: ConsultantAnswer; envelope: AiEnvelope<ConsultantAnswer>; ms: number };

export function Consultant() {
  const t = useTx();
  const lang = useLang();
  const reduced = useReducedMotion();
  const sp = useSearchParams();
  const logEvent = useStore((s) => s.logEvent);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(() => {
    const f = getFixture(sp.get("fixture") ?? "");
    return f ? `ספרו לי על ${f.nameHe}` : "";
  });
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  // A ?fixture= prefill follows the language once the store has hydrated, and takes focus once.
  const focusedOnce = useRef(false);
  useEffect(() => {
    const f = getFixture(sp.get("fixture") ?? "");
    if (!f) return;
    const he = `ספרו לי על ${f.nameHe}`, en = `Tell me about ${f.name}`;
    setInput((v) => (v === "" || v === he || v === en ? (lang === "he" ? he : en) : v));
    if (!focusedOnce.current) { focusedOnce.current = true; inputRef.current?.focus(); }
  }, [lang, sp]);
  useEffect(() => { if (messages.length) endRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" }); }, [messages, reduced]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    const uid = ++idRef.current, cid = ++idRef.current;
    const history = messages.flatMap((m): { role: "user" | "assistant"; content: string }[] =>
      m.role === "user" ? [{ role: "user", content: m.text }] : m.pending ? [] : [{ role: "assistant", content: m.answer.text[lang] }]);
    const turns = [...history, { role: "user" as const, content: q }];
    setMessages((ms) => [...ms, { id: uid, role: "user", text: q }, { id: cid, role: "consultant", pending: true }]);
    const t0 = performance.now();
    let env: AiEnvelope<ConsultantAnswer>;
    try {
      const res = await fetch("/api/ai/consultant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: turns }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      env = (await res.json()) as AiEnvelope<ConsultantAnswer>;
    } catch {
      env = envelope(simulateConsultant(turns), "simulation", Math.round(performance.now() - t0));
    }
    const ms = Math.round(performance.now() - t0);
    const wait = Math.max(0, (reduced ? 0 : 900) - ms);
    if (wait) await new Promise((r) => setTimeout(r, wait));
    setMessages((ms2) => ms2.map((m) => (m.id === cid ? { id: cid, role: "consultant", answer: env.data, envelope: env, ms } : m)));
    logEvent({
      actor: "designer", type: "ai.consult", fixtureId: env.data.fixtureIds[0],
      payload: { source: env.source, fixtureIds: env.data.fixtureIds, ms },
      title: { he: `שאלה ליועץ: ${q.slice(0, 60)}${q.length > 60 ? "…" : ""}`, en: `Consultant asked: ${q.slice(0, 60)}${q.length > 60 ? "…" : ""}` },
    });
    setBusy(false);
    inputRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); void ask(input); };

  return (
    <>
      <PageHeader
        eyebrow={`${t(BETA)} · ${t(SIMULATION)}`}
        title={t({ he: "היועץ", en: "The consultant" })}
        lede={t({
          he: "שאלות של תכנון תאורה: עמעום, טמפרטורת צבע, דרגת אטימות, גובה תקרה, לומן למ״ר. היועץ עונה רק מתוך נתוני הקטלוג — כל מספר שמופיע כאן קיים בדף המוצר.",
          en: "Lighting-design questions: dimming, colour temperature, IP rating, ceiling height, lumens per m². The consultant answers only from catalogue data — every figure here exists on the product page.",
        })}
        beta
        betaLabel={t(BETA)}
      />

      <section className="container-x pb-28">
        <div className="mx-auto max-w-4xl">
          <p className="mb-8 flex flex-wrap items-center gap-3 border-y hairline py-3 text-[0.8rem] text-muted">
            <span className="badge-beta">{t(BETA)} · {t(SIMULATION)}</span>
            <span>{t({ he: "בדמו ללא מפתח API התשובות מחושבות מקומית בכללים ובאחזור מהקטלוג; עם מפתח, מודל שפה עונה ומצטט אך ורק מאותם נתונים.", en: "Without an API key the demo answers locally from rules and catalogue retrieval; with a key a model answers, quoting the same data only." })}</span>
          </p>

          <div className="flex flex-col gap-8" aria-live="polite" aria-relevant="additions" aria-label={t({ he: "שיחה עם היועץ", en: "Conversation with the consultant" })}>
            <SwitchOn as="div" className="max-w-2xl border-s-2 border-brass/70 ps-5">
              <p className="eyebrow mb-1.5">{t({ he: "היועץ", en: "Consultant" })}</p>
              <p className="text-[0.98rem] leading-relaxed text-paper">
                {t({ he: "שלום. ספרו לי על החלל — סלון, מטבח, חדר רחצה או מרפסת — על גובה התקרה ועל האווירה שאתם מחפשים, ואציע גופי תאורה מהקטלוג עם הנתונים המדויקים שלהם.", en: "Hello. Tell me about the space — living room, kitchen, bathroom or terrace — the ceiling height and the mood you are after, and I will suggest catalogue fixtures with their exact figures." })}
              </p>
            </SwitchOn>

            {messages.map((m, i) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] border hairline bg-charcoal px-4 py-3 text-[0.98rem] leading-relaxed text-paper md:max-w-[70%]">
                      <span className="sr-only">{t({ he: "אתם: ", en: "You: " })}</span>{m.text}
                    </p>
                  </div>
                );
              }
              if (m.pending) {
                return (
                  <div key={m.id} className="max-w-2xl border-s-2 border-brass/40 ps-5" role="status" aria-label={t({ he: "היועץ בודק בקטלוג", en: "The consultant is checking the catalogue" })}>
                    <p className="eyebrow mb-2">{t({ he: "היועץ", en: "Consultant" })}</p>
                    <p className="font-mono text-[0.72rem] tracking-wider text-glow">{t({ he: "בודק בקטלוג…", en: "Checking the catalogue…" })}</p>
                    <div className="mt-3 h-px w-56 bg-ash/50">
                      <motion.div className="h-px bg-brass" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduced ? 0 : 1.1, ease: "easeInOut" }} style={{ transformOrigin: lang === "he" ? "100% 50%" : "0 50%" }} />
                    </div>
                  </div>
                );
              }
              const a = m.answer;
              return (
                <SwitchOn key={m.id} on as="div" className="border-s-2 border-brass/70 ps-5">
                  <p className="eyebrow mb-1.5">{t({ he: "היועץ", en: "Consultant" })}</p>
                  <p className="max-w-2xl text-[0.98rem] leading-relaxed text-paper">{a.text[lang]}</p>
                  {a.fixtureIds.length > 0 && (
                    <div className="mt-5 grid gap-3 md:grid-cols-2" data-consultant-cards={a.fixtureIds.length}>
                      {a.fixtureIds.map((id, j) => <ProductCard key={id} fixtureId={id} facts={a.facts.filter((f) => f.fixtureId === id)} delay={j * 110} />)}
                    </div>
                  )}
                  <AiNotice envelope={m.envelope} ms={m.ms} className="mt-4 max-w-2xl" />
                  {i === messages.length - 1 && <div ref={endRef} />}
                </SwitchOn>
              );
            })}
          </div>

          <div className="sticky bottom-0 mt-10 bg-night/92 pb-12 pt-4 backdrop-blur md:pb-4">
            <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" role="group" aria-label={t({ he: "שאלות לדוגמה", en: "Suggested questions" })}>
              {SUGGESTIONS.map((s) => (
                <button key={s.he} type="button" className="chip shrink-0 whitespace-nowrap" onClick={() => void ask(t(s))} disabled={busy}>{t(s)}</button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex gap-2">
              <label htmlFor="consultant-input" className="sr-only">{t({ he: "השאלה שלכם", en: "Your question" })}</label>
              <input
                id="consultant-input"
                ref={inputRef}
                className="field flex-1 placeholder:text-muted"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t({ he: "למשל: תלוי מעל אי מטבח, תקרה 2.6 מ׳, עמעום DALI", en: "e.g. a pendant over a kitchen island, 2.6 m ceiling, DALI dimming" })}
                autoComplete="off"
                enterKeyHint="send"
                disabled={busy}
              />
              <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>{busy ? t({ he: "בודק…", en: "Checking…" }) : t({ he: "שליחה", en: "Send" })}</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

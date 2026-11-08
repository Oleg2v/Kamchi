"use client";
import type { ReactNode } from "react";
import { formatNumber, useLang, useTx } from "@/lib/i18n";
import { DIMMING_LABEL, FINISH_HEX, FINISH_LABEL, LEAD_TIME_LABEL } from "@/lib/i18n/common";
import { efficacy } from "@/lib/catalog/filter";
import type { Fixture, LeadTime } from "@/lib/types";

type Props = { fixture: Fixture; leadTime: LeadTime; stock: number };

function Row({ label, children, ltr = false }: { label: string; children: ReactNode; ltr?: boolean }) {
  return (
    <div className="spec-row">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`text-sm text-paper ${ltr ? "num text-start" : ""}`} dir={ltr ? "ltr" : undefined}>{children}</dd>
    </div>
  );
}

export function FinishSwatch({ id, className = "" }: { id: keyof typeof FINISH_HEX; className?: string }) {
  return <span aria-hidden className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-white/15 ${className}`} style={{ background: FINISH_HEX[id] }} />;
}

/** Photometrics and physicals as a quiet definition list; numbers in mono, LTR. */
export function SpecTable({ fixture: f, leadTime, stock }: Props) {
  const t = useTx();
  const lang = useLang();
  const n = (v: number) => <span className="num">{v}</span>;
  const size = lang === "he"
    ? f.size.diameter
      ? <>קוטר {n(f.size.diameter)} · גובה {n(f.size.h)} ס״מ</>
      : <>רוחב {n(f.size.w)} · גובה {n(f.size.h)}{f.size.d !== undefined && <> · עומק {n(f.size.d)}</>} ס״מ</>
    : <span className="num" dir="ltr">{f.size.diameter ? `⌀ ${f.size.diameter} · H ${f.size.h} cm` : `W ${f.size.w} · H ${f.size.h}${f.size.d !== undefined ? ` · D ${f.size.d}` : ""} cm`}</span>;

  return (
    <dl className="border-t hairline" data-testid="spec-table">
      <Row label={t({ he: "שטף אור", en: "Luminous flux" })} ltr>{formatNumber(f.lumens, lang)} lm</Row>
      <Row label={t({ he: "טמפרטורת צבע", en: "Colour temperature" })} ltr>{f.kelvin.join(" / ")} K</Row>
      <Row label="CRI" ltr>{f.cri}</Row>
      <Row label={t({ he: "הספק", en: "Power" })} ltr>{f.watts} W</Row>
      <Row label={t({ he: "נצילות", en: "Efficacy" })} ltr>{efficacy(f)} lm/W</Row>
      <Row label={t({ he: "דרגת אטימות", en: "IP rating" })} ltr>IP{f.ip}</Row>
      <Row label={t({ he: "עמעום", en: "Dimming" })}>{f.dimming.map((d) => t(DIMMING_LABEL[d])).join(" · ")}</Row>
      <Row label={t({ he: "מידות", en: "Dimensions" })}>{size}</Row>
      <Row label={t({ he: "גימורים", en: "Finishes" })}>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {f.finishes.map((fin) => (
            <li key={fin} className="inline-flex items-center gap-2"><FinishSwatch id={fin} />{t(FINISH_LABEL[fin])}</li>
          ))}
        </ul>
      </Row>
      <Row label={t({ he: "זמן אספקה", en: "Lead time" })}>
        <span className={leadTime === "stock" ? "lit-text" : ""} data-testid="lead-time">{t(LEAD_TIME_LABEL[leadTime])}</span>
        {stock > 0 && <span className="ms-3 num text-muted" data-testid="stock">{t({ he: "במלאי:", en: "In stock:" })} {stock}</span>}
      </Row>
      {f.designer && (
        <Row label={t({ he: "עיצוב", en: "Design" })}><span lang="en">{f.designer}</span>{f.year ? <span className="num ms-2 text-muted" dir="ltr">{f.year}</span> : null}</Row>
      )}
    </dl>
  );
}

"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PriceRange } from "./PriceRange";
import { getBrand } from "@/lib/data";
import { useTx } from "@/lib/i18n";
import { DIMMING_LABEL, FIXTURE_TYPE_LABEL, SPACE_LABEL } from "@/lib/i18n/common";
import { FACET_VALUES, PRICE_BOUNDS, type CatalogParams, type FacetKey } from "@/lib/catalog/filter";
import { FACET_LABEL, SIZE_LABEL } from "@/lib/catalog/labels";
import type { Dimming, FixtureType, IpRating, Kelvin, Space } from "@/lib/types";
import type { SizeBucket } from "@/lib/catalog/filter";

type Props = {
  params: CatalogParams;
  counts: Record<FacetKey, Record<string, number>>;
  onToggle: <K extends FacetKey>(key: K, value: CatalogParams[K][number]) => void;
  onPrice: (min: number | undefined, max: number | undefined) => void;
  onQuery: (q: string) => void;
  /** id prefix so the rail and the sheet never share ids. */
  idPrefix: string;
};

function Group({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" aria-labelledby={id}>
      <legend id={id} className="eyebrow mb-3">{title}</legend>
      {children}
    </fieldset>
  );
}

function Chip({ on, count, onClick, children, mono = false }: { on: boolean; count: number; onClick: () => void; children: ReactNode; mono?: boolean }) {
  return (
    <button type="button" className={`chip ${mono ? "num" : ""}`} aria-pressed={on} data-empty={!on && count === 0 ? "1" : undefined} onClick={onClick}>
      <span>{children}</span>
      <span className="num text-[0.62rem] opacity-70" aria-label={`(${count})`}>{count}</span>
    </button>
  );
}

/** The filter rail's content — shared by the desktop rail and the mobile sheet. */
export function FilterGroups({ params, counts, onToggle, onPrice, onQuery, idPrefix }: Props) {
  const t = useTx();
  const [q, setQ] = useState(params.q);
  const lastSent = useRef(params.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (params.q !== lastSent.current) { lastSent.current = params.q; setQ(params.q); }
  }, [params.q]);

  const onType = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { lastSent.current = v; onQuery(v); }, 200);
  };

  const id = (k: string) => `${idPrefix}-${k}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <label htmlFor={id("q")} className="eyebrow mb-3 block">{t(FACET_LABEL.q)}</label>
        <input
          id={id("q")}
          type="search"
          className="field min-h-0 py-2 text-sm"
          placeholder={t({ he: "שם, מותג או תגית", en: "Name, brand or tag" })}
          value={q}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (timer.current) clearTimeout(timer.current); lastSent.current = q; onQuery(q); } }}
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      <Group title={t(FACET_LABEL.space)} id={id("space")}>
        <div className="flex flex-wrap gap-1.5">
          {FACET_VALUES.space.map((v) => (
            <Chip key={v} on={params.space.includes(v as Space)} count={counts.space[v] ?? 0} onClick={() => onToggle("space", v as Space)}>{t(SPACE_LABEL[v as Space])}</Chip>
          ))}
        </div>
      </Group>

      <Group title={t(FACET_LABEL.brand)} id={id("brand")}>
        <div className="flex flex-wrap gap-1.5">
          {FACET_VALUES.brand.map((v) => (
            <Chip key={v} on={params.brand.includes(v)} count={counts.brand[v] ?? 0} onClick={() => onToggle("brand", v)}><span lang="en">{getBrand(v)?.name ?? v}</span></Chip>
          ))}
        </div>
      </Group>

      <Group title={t(FACET_LABEL.type)} id={id("type")}>
        <div className="flex flex-wrap gap-1.5">
          {FACET_VALUES.type.map((v) => (
            <Chip key={v} on={params.type.includes(v as FixtureType)} count={counts.type[v] ?? 0} onClick={() => onToggle("type", v as FixtureType)}>{t(FIXTURE_TYPE_LABEL[v as FixtureType])}</Chip>
          ))}
        </div>
      </Group>

      <Group title={t(FACET_LABEL.size)} id={id("size")}>
        <div className="flex flex-wrap gap-1.5">
          {FACET_VALUES.size.map((v) => (
            <Chip key={v} on={params.size.includes(v as SizeBucket)} count={counts.size[v] ?? 0} onClick={() => onToggle("size", v as SizeBucket)}>{t(SIZE_LABEL[v as SizeBucket])}</Chip>
          ))}
        </div>
      </Group>

      <Group title={t(FACET_LABEL.k)} id={id("k")}>
        <div className="flex flex-wrap gap-1.5" dir="ltr">
          {FACET_VALUES.k.map((v) => (
            <Chip key={v} mono on={params.k.includes(v as Kelvin)} count={counts.k[String(v)] ?? 0} onClick={() => onToggle("k", v as Kelvin)}>{v}K</Chip>
          ))}
        </div>
      </Group>

      <Group title={t(FACET_LABEL.dim)} id={id("dim")}>
        <div className="flex flex-wrap gap-1.5">
          {FACET_VALUES.dim.map((v) => (
            <Chip key={v} on={params.dim.includes(v as Dimming)} count={counts.dim[v] ?? 0} onClick={() => onToggle("dim", v as Dimming)}>{t(DIMMING_LABEL[v as Dimming])}</Chip>
          ))}
        </div>
      </Group>

      <Group title={t(FACET_LABEL.ip)} id={id("ip")}>
        <div className="flex flex-wrap gap-1.5" dir="ltr">
          {FACET_VALUES.ip.map((v) => (
            <Chip key={v} mono on={params.ip.includes(v as IpRating)} count={counts.ip[String(v)] ?? 0} onClick={() => onToggle("ip", v as IpRating)}>IP{v}</Chip>
          ))}
        </div>
      </Group>

      <Group title={t(FACET_LABEL.price)} id={id("price")}>
        <PriceRange min={params.min} max={params.max} bounds={PRICE_BOUNDS} onChange={onPrice} />
      </Group>
    </div>
  );
}

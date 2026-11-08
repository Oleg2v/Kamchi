"use client";
import { getBrand } from "@/lib/data";
import { formatIls, useLang, useTx } from "@/lib/i18n";
import { DIMMING_LABEL, FIXTURE_TYPE_LABEL, SPACE_LABEL } from "@/lib/i18n/common";
import { SORT_KEYS, type ActiveChip, type CatalogParams, type SortKey } from "@/lib/catalog/filter";
import { FACET_LABEL, SIZE_SHORT, SORT_LABEL } from "@/lib/catalog/labels";
import type { Dimming, FixtureType, Space } from "@/lib/types";
import type { SizeBucket } from "@/lib/catalog/filter";
import type { Lang } from "@/lib/types";

type Props = {
  count: number;
  params: CatalogParams;
  chips: ActiveChip[];
  onRemove: (chip: ActiveChip) => void;
  onClear: () => void;
  onSort: (s: SortKey) => void;
  onOpenFilters: () => void;
  activeCount: number;
};

export function chipLabel(chip: ActiveChip, lang: Lang, t: (s: { he: string; en: string } | string) => string): string {
  switch (chip.kind) {
    case "min": return `${t({ he: "מ־", en: "from " })}${formatIls(chip.value, lang)}`;
    case "max": return `${t({ he: "עד ", en: "up to " })}${formatIls(chip.value, lang)}`;
    case "q": return `„${chip.value}”`;
    case "facet":
      switch (chip.key) {
        case "space": return t(SPACE_LABEL[chip.value as Space]);
        case "brand": return getBrand(chip.value)?.name ?? chip.value;
        case "type": return t(FIXTURE_TYPE_LABEL[chip.value as FixtureType]);
        case "size": return t(SIZE_SHORT[chip.value as SizeBucket]);
        case "k": return `${chip.value}K`;
        case "dim": return t(DIMMING_LABEL[chip.value as Dimming]);
        case "ip": return `IP${chip.value}`;
      }
  }
}

/** "{n} גופי תאורה", sort, the mobile סינון button and the active-filter chips. */
export function ResultsHeader({ count, params, chips, onRemove, onClear, onSort, onOpenFilters, activeCount }: Props) {
  const t = useTx();
  const lang = useLang();
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b hairline pb-4">
        <h2 className="flex items-baseline gap-2 text-base font-normal" aria-live="polite">
          {count === 1 ? (
            <span className="text-muted" data-testid="results-count" data-count={1}>{t({ he: "גוף תאורה אחד", en: "1 fixture" })}</span>
          ) : (
            <>
              <span className="num text-2xl text-paper" data-testid="results-count" data-count={count}>{count}</span>
              <span className="text-muted">{t({ he: "גופי תאורה", en: "fixtures" })}</span>
            </>
          )}
        </h2>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onOpenFilters} className="btn btn-sm lg:hidden" aria-haspopup="dialog" data-testid="open-filters">
            {t({ he: "סינון", en: "Filters" })}
            {activeCount > 0 && <span className="num text-glow">{activeCount}</span>}
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>{t({ he: "מיון", en: "Sort" })}</span>
            <select
              className="field min-h-0 w-auto py-1.5 pe-8 text-sm text-paper"
              value={params.sort}
              onChange={(e) => onSort(e.target.value as SortKey)}
              data-testid="sort"
            >
              {SORT_KEYS.map((k) => <option key={k} value={k}>{t(SORT_LABEL[k])}</option>)}
            </select>
          </label>
        </div>
      </div>
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={t({ he: "סינון פעיל", en: "Active filters" })} data-testid="active-chips">
          {chips.map((c) => {
            const label = chipLabel(c, lang, t);
            const group = c.kind === "facet" ? t(FACET_LABEL[c.key]) : c.kind === "q" ? t(FACET_LABEL.q) : t(FACET_LABEL.price);
            return (
              <button
                key={`${c.kind}-${"key" in c ? c.key : ""}-${c.value}`}
                type="button"
                className="chip is-on"
                onClick={() => onRemove(c)}
                aria-label={t({ he: `הסרת הסינון ${group}: ${label}`, en: `Remove ${group} filter: ${label}` })}
              >
                <span>{label}</span>
                <span aria-hidden className="text-[0.7rem] opacity-80">✕</span>
              </button>
            );
          })}
          <button type="button" onClick={onClear} className="ms-1 text-sm text-muted underline-offset-4 hover:text-glow hover:underline" data-testid="clear-filters">
            {t({ he: "ניקוי", en: "Clear" })}
          </button>
        </div>
      )}
    </div>
  );
}

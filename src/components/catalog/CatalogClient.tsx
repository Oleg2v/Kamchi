"use client";
import "./catalog.css";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SwitchOn } from "@/components/light/SwitchOn";
import { CatalogEmpty } from "./CatalogEmpty";
import { FilterGroups } from "./FilterGroups";
import { FilterSheet } from "./FilterSheet";
import { ProductCard } from "./ProductCard";
import { ResultsHeader } from "./ResultsHeader";
import { useCatalogParams } from "./useCatalogParams";
import { FIXTURES, BRANDS } from "@/lib/data";
import { useTx } from "@/lib/i18n";
import { activeChips, allFacetCounts, countActive, filterFixtures } from "@/lib/catalog/filter";

/**
 * /catalog — the whole catalogue, filtered from the URL. Desktop: sticky rail at
 * inline-start (right in RTL). Mobile: a "סינון" sheet. Every card is unlit until reached.
 */
export function CatalogClient() {
  const t = useTx();
  const { params, toggle, setPrice, setQuery, setSort, remove, clear } = useCatalogParams();
  const results = useMemo(() => filterFixtures(FIXTURES, params), [params]);
  const counts = useMemo(() => allFacetCounts(FIXTURES, params), [params]);
  const chips = useMemo(() => activeChips(params), [params]);
  const active = useMemo(() => countActive(params), [params]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Closing the sheet on a desktop resize keeps the dialog from lingering off-screen.
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => { if (m.matches) setSheetOpen(false); };
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  const groups = (prefix: string) => (
    <FilterGroups params={params} counts={counts} onToggle={toggle} onPrice={setPrice} onQuery={setQuery} idPrefix={prefix} />
  );

  return (
    <>
      <PageHeader
        eyebrow={t({ he: "קטלוג", en: "Catalogue" })}
        title={t({ he: "גופי תאורה", en: "Fixtures" })}
        lede={t({
          he: `${FIXTURES.length} גופי תאורה מ־${BRANDS.length} מותגים. כל גוף כבוי עד שמגיעים אליו; המחירים הם מחירי הדגמה וכוללים מע״מ.`,
          en: `${FIXTURES.length} fixtures from ${BRANDS.length} brands. Every piece stays off until you reach it; prices are demo prices and include VAT.`,
        })}
      />

      <section className="container-x lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-12" aria-label={t({ he: "קטלוג גופי תאורה", en: "Fixture catalogue" })}>
        <aside className="hidden lg:block" aria-label={t({ he: "סינון", en: "Filters" })} data-testid="filter-rail">
          <div className="no-scrollbar sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100dvh-var(--header-h)-3rem)] overflow-y-auto border-e hairline pe-6">
            <SwitchOn offOpacity={0.3}>{groups("rail")}</SwitchOn>
          </div>
        </aside>

        <div className="min-w-0">
          <ResultsHeader
            count={results.length}
            params={params}
            chips={chips}
            onRemove={remove}
            onClear={clear}
            onSort={setSort}
            onOpenFilters={() => setSheetOpen(true)}
            activeCount={active}
          />
          {results.length === 0 ? (
            <CatalogEmpty onClear={clear} />
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-10 xl:grid-cols-4" data-testid="product-grid">
              {results.map((f) => (
                <li key={f.id} className="min-w-0">
                  <ProductCard fixture={f} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onClear={clear} count={results.length} activeCount={active}>
        {groups("sheet")}
      </FilterSheet>
    </>
  );
}

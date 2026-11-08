"use client";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { FIXTURES } from "@/lib/data";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useTx } from "@/lib/i18n";
import { selectOpenRequests, selectUnseenForDesk, useStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { DESK_TABS, DeskTabs, isDeskTab, type DeskTab } from "./DeskTabs";
import { InboxTab } from "./InboxTab";
import { LogTab } from "./LogTab";
import { OrdersTab } from "./OrdersTab";
import { ProjectsWall } from "./ProjectsWall";
import { StockTab } from "./StockTab";

export interface DeskAppProps {
  /** Inside the live split screen: tabs are component state, no page header. */
  embedded?: boolean;
  /** Embedded: delay (ms) before a designer's action flashes the inbox — lets the flying dot arrive first. */
  flashDelay?: number;
  /** Embedded: the inbox tab itself flashes for 1.2 s. */
  inboxFlash?: boolean;
}

function DeskSkeleton({ embedded }: { embedded: boolean }) {
  return (
    <div className={embedded ? "grid gap-4 px-4 py-4" : "container-x grid gap-6 pt-10 md:pt-16"} aria-hidden>
      {!embedded && <Skeleton className="h-14 w-1/2 max-w-md md:h-20" />}
      <Skeleton className="h-10" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}

/** Tab state: a real query string when standalone (/desk?tab=…), component state when embedded. */
function useTabState(embedded: boolean): [DeskTab, (t: DeskTab) => void] {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fromUrl = sp.get("tab");
  const [local, setLocal] = useState<DeskTab>("inbox");
  const tab: DeskTab = embedded ? local : isDeskTab(fromUrl) ? fromUrl : "inbox";
  const set = useCallback(
    (t: DeskTab) => {
      if (embedded) { setLocal(t); return; }
      router.replace(t === "inbox" ? pathname : `${pathname}?tab=${t}`, { scroll: false });
    },
    [embedded, router, pathname],
  );
  return [tab, set];
}

/**
 * שולחן הפרויקטים — the Kamchi side. Requests come in lit; quotes go out with a PDF;
 * stock, lead times and order steps change here and appear on every designer's board.
 */
export function DeskApp({ embedded = false, flashDelay = 0, inboxFlash = false }: DeskAppProps) {
  const t = useTx();
  const hydrated = useHydrated();
  const [tab, setTab] = useTabState(embedded);
  const open = useStore(useShallow(selectOpenRequests));
  const unseen = useStore(selectUnseenForDesk);
  const projects = useStore((s) => s.projects);
  const events = useStore((s) => s.events);

  const orders = useMemo(() => projects.reduce((n, p) => n + p.rooms.reduce((m, r) => m + r.items.filter((i) => i.orderStatus && i.orderStatus !== "delivered").length, 0), 0), [projects]);
  const counts: Partial<Record<DeskTab, number>> = { inbox: open.length, orders, projects: projects.length, stock: FIXTURES.length, log: events.length };
  const hot: Partial<Record<DeskTab, boolean>> = { inbox: unseen > 0 };

  if (!hydrated) return <DeskSkeleton embedded={embedded} />;

  const panel = (
    <div role="tabpanel" id={`desk-panel-${tab}`} aria-labelledby={`desk-tab-${tab}`} className="pt-5">
      {tab === "inbox" && <InboxTab embedded={embedded} flashDelay={flashDelay} />}
      {tab === "orders" && <OrdersTab embedded={embedded} />}
      {tab === "projects" && <ProjectsWall embedded={embedded} />}
      {tab === "stock" && <StockTab />}
      {tab === "log" && <LogTab limit={embedded ? 60 : 160} />}
    </div>
  );

  if (embedded) {
    return (
      <div className="px-4 py-4">
        <DeskTabs tab={tab} onChange={setTab} counts={counts} hot={hot} flash={inboxFlash} />
        {panel}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t({ he: "שולחן הפרויקטים · צוות קמחי", en: "Project desk · Kamchi team" })}
        title={t({ he: "שולחן הפרויקטים", en: "The project desk" })}
        lede={
          <>
            {t({ he: "בקשות מהסטודיו, הצעות מחיר, הזמנות באיטליה, מלאי בבני ברק. כל שינוי כאן מופיע אצל המעצבים ברגע שהוא נעשה.", en: "Requests from the studios, quotes, orders in Italy, stock in Bnei Brak. Every change here reaches the designers as it is made." })}
            {unseen > 0 && (
              <span className="num ms-2 text-glow" dir="ltr">· {unseen} {t({ he: "חדשים", en: "new" })}</span>
            )}
          </>
        }
      />
      <div className="container-x pb-20">
        <DeskTabs tab={tab} onChange={setTab} counts={counts} hot={hot} />
        {panel}
      </div>
      <p className="sr-only">{DESK_TABS.map((x) => t(x.label)).join(" · ")}</p>
    </>
  );
}

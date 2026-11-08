"use client";
/**
 * The club today: about sixty names on a page. Six demo studios are lit and
 * lead into the portal; the other fifty-four are reserved places, drawn as
 * unlit names that light under the pointer (and under "הכול דלוק").
 */
import { TransitionLink } from "@/components/brand/TransitionLink";
import { SwitchOn } from "@/components/light/SwitchOn";
import { STUDIOS } from "@/lib/data";
import { useLang, useTx } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Studio } from "@/lib/types";

const WALL_SIZE = 60;
/** Where the six lit studios sit on the wall (0-based), spread like a constellation. */
const LIT_SLOTS = [0, 8, 17, 27, 38, 50];

type Cell = { index: number; studio?: Studio };

function buildWall(): Cell[] {
  const cells: Cell[] = Array.from({ length: WALL_SIZE }, (_, i) => ({ index: i + 1 }));
  STUDIOS.forEach((s, i) => {
    const slot = LIT_SLOTS[i] ?? i;
    if (cells[slot]) cells[slot].studio = s;
  });
  return cells;
}

const WALL = buildWall();

function LitStudio({ studio, index, order }: { studio: Studio; index: number; order: number }) {
  const t = useTx();
  const lang = useLang();
  const setCurrentStudio = useStore((s) => s.setCurrentStudio);
  return (
    <SwitchOn offOpacity={0.14} delay={200 + order * 110} className="h-full">
      <TransitionLink
        href="/studio"
        onClick={() => setCurrentStudio(studio.id)}
        className="group flex h-full flex-col justify-between gap-3 p-3 outline-offset-[-3px] md:p-4"
        data-testid={`club-studio-${studio.id}`}
        aria-label={`${lang === "he" ? studio.name : studio.nameEn} — ${t({ he: "כניסה לסטודיו", en: "enter the studio" })}`}
      >
        <span className="flex items-center justify-between font-mono text-[0.66rem] tracking-[0.12em] text-brass-light">
          <span className="num" dir="ltr">{String(index).padStart(2, "0")}</span>
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-glow shadow-glow" />
        </span>
        <span className="c-studio-name font-display text-xl leading-tight text-paper group-hover:text-glow group-focus-visible:text-glow md:text-2xl">{lang === "he" ? studio.name : studio.nameEn}</span>
        <span className="font-mono text-[0.66rem] text-muted">{lang === "he" ? studio.city : studio.cityEn} · {t({ he: "חבר מועדון מאז", en: "member since" })} <span className="num" dir="ltr">{studio.memberSince}</span></span>
      </TransitionLink>
    </SwitchOn>
  );
}

function Ghost({ index }: { index: number }) {
  const t = useTx();
  // A reserved place: quiet (muted, still ≥ 7:1), switched on by scroll like every other element,
  // and it turns to light under the pointer. Not a link, so not in the tab order.
  return (
    <SwitchOn offOpacity={0.14} hover delay={(index % 6) * 40} className="h-full">
      <div className="c-ghost flex h-full flex-col justify-between gap-3 p-3 md:p-4" data-testid="club-ghost">
        <span className="num font-mono text-[0.66rem] tracking-[0.12em]" dir="ltr">{String(index).padStart(2, "0")}</span>
        <span className="c-ghost-name font-display text-xl leading-tight md:text-2xl">{t({ he: "סטודיו ·", en: "Studio ·" })}</span>
        <span className="font-mono text-[0.66rem]">{t({ he: "מקום שמור — הדגמה", en: "Reserved — demo" })}</span>
      </div>
    </SwitchOn>
  );
}

export function ClubWall() {
  const t = useTx();
  let litOrder = 0;
  return (
    <section className="container-x py-16 md:py-24" aria-labelledby="wall-h">
      <SwitchOn offOpacity={0.12} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-3">{t({ he: "הרשימה", en: "The list" })}</p>
          <h2 id="wall-h" className="font-display text-4xl leading-[1.05] md:text-5xl">{t({ he: "שישים שמות על קיר", en: "Sixty names on a wall" })}</h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          {t({
            he: "שישה סטודיו הדגמה דולקים ומובילים לפורטל בשמם. חמישים וארבעה המקומות האחרים שמורים (הדגמה) — נדלקים כשעוברים עליהם.",
            en: "Six demo studios are lit and lead into the portal under their name. The other fifty-four places are reserved (demo) and light as you pass over them.",
          })}
        </p>
      </SwitchOn>
      <ol className="mt-10 grid grid-cols-3 border-s border-t hairline md:grid-cols-4 lg:grid-cols-6" data-testid="club-wall">
        {WALL.map((cell) => (
          <li key={cell.index} className="min-h-[6.25rem] border-b border-e hairline md:min-h-[7rem]">
            {cell.studio ? <LitStudio studio={cell.studio} index={cell.index} order={litOrder++} /> : <Ghost index={cell.index} />}
          </li>
        ))}
      </ol>
      <p className="mt-4 font-mono text-[0.68rem] leading-relaxed text-muted">
        {t({ he: "השמות הדולקים הם סטודיו הדגמה; המקומות השמורים אינם מייצגים סטודיו אמיתיים.", en: "The lit names are demo studios; reserved places do not represent real studios." })}
      </p>
    </section>
  );
}

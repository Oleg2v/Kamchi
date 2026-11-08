"use client";
import "./content.css";
import { TransitionLink } from "@/components/brand/TransitionLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTx } from "@/lib/i18n";
import { BrandList } from "./BrandList";
import { ShowroomVisit } from "./ShowroomVisit";
import { Timeline } from "./Timeline";

export function AboutPage() {
  const t = useTx();
  return (
    <>
      <PageHeader
        eyebrow={t({ he: "אודות", en: "About" })}
        title={t({ he: "שמונים שנה של אור", en: "Eighty years of light" })}
        lede={t({
          he: "סדנה בדרום תל אביב שהפכה לבית היבוא המוביל בישראל לתאורה מעוצבת. שלושה דורות, שישה-עשר בתי תאורה, ואולם תצוגה שבו הכול דולק. גללו — וכל תקופה נדלקת בתורה.",
          en: "A workshop in south Tel Aviv that became Israel's leading importer of designer lighting. Three generations, sixteen lighting houses, and a showroom where everything is lit. Scroll, and each era switches on in turn.",
        })}
        actions={
          <>
            <TransitionLink href="/about#visit" className="btn btn-primary">{t({ he: "ביקור באולם", en: "Visit the showroom" })}</TransitionLink>
            <TransitionLink href="/projects" className="btn">{t({ he: "הפרויקטים", en: "The projects" })}</TransitionLink>
          </>
        }
      />
      <Timeline />
      <BrandList />
      <ShowroomVisit />
    </>
  );
}

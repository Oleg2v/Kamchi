import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogClient } from "@/components/catalog/CatalogClient";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";

export const metadata: Metadata = {
  title: "קטלוג גופי תאורה",
  description: "60 גופי תאורה מ־16 מותגים — סינון לפי חלל, מותג, סוג, גודל, טמפרטורת צבע, עמעום ודרגת אטימות. מחירי הדגמה.",
};

/** The client reads useSearchParams, so it renders inside Suspense. */
export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogClient />
    </Suspense>
  );
}

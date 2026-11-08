import type { Metadata } from "next";
import { Suspense } from "react";
import { RelightStudio } from "@/components/ai/RelightStudio";

export const metadata: Metadata = {
  title: "תאירו לי את הסלון",
  description: "הדמיית תאורה מתמונה: מעלים תמונה של החדר, בוחרים גוף תאורה מהקטלוג ורואים איך האור נופל. בטא · הדמיה.",
};

export default function RelightPage() {
  return (
    <Suspense fallback={<div className="container-x py-24"><div className="skeleton h-72" /></div>}>
      <RelightStudio />
    </Suspense>
  );
}

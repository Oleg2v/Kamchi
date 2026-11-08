import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanStudio } from "@/components/ai/PlanStudio";

export const metadata: Metadata = {
  title: "תוכנית תאורה מתוכנית דירה",
  description: "מעלים תוכנית דירה (תמונה או PDF) ומקבלים תוכנית תאורה בשלוש שכבות עם גופי תאורה מהקטלוג ורשימת רכש. בטא · הדמיה.",
};

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="container-x py-24"><div className="skeleton h-72" /></div>}>
      <PlanStudio />
    </Suspense>
  );
}

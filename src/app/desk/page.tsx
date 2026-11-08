import type { Metadata } from "next";
import { Suspense } from "react";
import { DeskApp } from "@/components/desk/DeskApp";

export const metadata: Metadata = {
  title: "שולחן הפרויקטים",
  description: "הצד של צוות קמחי (קונספט): בקשות להצעת מחיר, הכנת הצעות עם PDF, מסלול ההזמנות, קיר הפרויקטים של הסטודיו, מלאי וזמני אספקה.",
};

/** The desk reads ?tab= with useSearchParams, so it renders inside Suspense. */
export default function DeskPage() {
  return (
    <Suspense fallback={<div className="container-x py-24"><div className="skeleton h-72" /></div>}>
      <DeskApp />
    </Suspense>
  );
}

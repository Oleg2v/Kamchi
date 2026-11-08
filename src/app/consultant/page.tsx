import type { Metadata } from "next";
import { Suspense } from "react";
import { Consultant } from "@/components/ai/Consultant";

export const metadata: Metadata = {
  title: "היועץ",
  description: "יועץ תאורה מבוסס קטלוג: עמעום, טמפרטורת צבע, דרגת אטימות, גובה תקרה ולומן למ״ר. בטא · הדמיה.",
};

export default function ConsultantPage() {
  return (
    <Suspense fallback={<div className="container-x py-24"><div className="skeleton h-72" /></div>}>
      <Consultant />
    </Suspense>
  );
}

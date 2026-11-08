import type { Metadata } from "next";
import { StudioApp } from "@/components/studio/StudioApp";

export const metadata: Metadata = {
  title: "לוח פרויקט · הסטודיו",
  description: "לוח הפרויקט: חדרים, גופי תאורה, זמני אספקה, מסלול ההזמנה והצעות המחיר שהתקבלו משולחן הפרויקטים.",
};

export default async function StudioProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <StudioApp projectId={projectId} />;
}

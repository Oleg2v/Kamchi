import type { Metadata } from "next";
import { StudioApp } from "@/components/studio/StudioApp";

export const metadata: Metadata = {
  title: "הסטודיו",
  description: "פורטל המעצבים של קמחי תאורה (קונספט): לוחות פרויקטים, זמני אספקה חיים, בקשות והצעות מחיר — מול שולחן הפרויקטים של צוות קמחי.",
};

export default function StudioPage() {
  return <StudioApp />;
}

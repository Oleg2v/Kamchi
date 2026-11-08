import type { Metadata } from "next";
import { ClubPage } from "@/components/content/ClubPage";

export const metadata: Metadata = {
  title: "מועדון האדריכלים והמעצבים",
  description: "כשישים סטודיו עובדים עם קמחי בתנאי סטודיו. היום — רשימת שמות; ההצעה — פורטל עם הצעות מחיר חיות, זמני אספקה וקובצי IES/DWG.",
};

export default function Page() {
  return <ClubPage />;
}

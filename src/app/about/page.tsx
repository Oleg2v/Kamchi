import type { Metadata } from "next";
import { AboutPage } from "@/components/content/AboutPage";

export const metadata: Metadata = {
  title: "אודות — שמונים שנה של אור",
  description: "מסדנה בדרום תל אביב לבית היבוא המוביל בישראל לתאורה מעוצבת: שלושה דורות, שישה-עשר מותגים, ואולם תצוגה של 5,000 מ״ר בבני ברק.",
};

export default function Page() {
  return <AboutPage />;
}

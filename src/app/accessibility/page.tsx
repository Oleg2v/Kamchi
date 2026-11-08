import type { Metadata } from "next";
import { AccessibilityPage } from "@/components/content/AccessibilityPage";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת הנגישות של אתר הקונספט: WCAG 2.0 AA ות״י 5568, הפעלה מלאה במקלדת, ניגודיות 7:1, „הכול דלוק”, תמיכה בצמצום תנועה. נובמבר 2026.",
};

export default function Page() {
  return <AccessibilityPage />;
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveScreen } from "@/components/live/LiveScreen";

export const metadata: Metadata = {
  title: "מצב חי",
  description: "הסטודיו ושולחן הפרויקטים זה לצד זה: כל פעולה של המעצב עוברת לצוות קמחי, וכל פעולה של הצוות חוזרת למעצב — עם הדגמה אוטומטית של 30 שניות.",
};

/** The screen reads ?autopilot= and ?record= with useSearchParams, so it renders inside Suspense. */
export default function LivePage() {
  return (
    <Suspense fallback={<div className="container-x py-24"><div className="skeleton h-[60dvh]" /></div>}>
      <LiveScreen />
    </Suspense>
  );
}

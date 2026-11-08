import type { Metadata } from "next";
import { ProjectsPage } from "@/components/content/ProjectsPage";

export const metadata: Metadata = {
  title: "פרויקטים",
  description: "קיר הפרויקטים של קמחי תאורה: משרדי Google ישראל, Airport City, מגדל מגדל, Cinema City, אולמות התצוגה של Mercedes, מטה ישרוטל ובתים פרטיים — ללא צילומים, כל גוף מצויר ונדלק.",
};

export default function Page() {
  return <ProjectsPage />;
}

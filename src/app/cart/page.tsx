import type { Metadata } from "next";
import { CartPage } from "@/components/catalog/CartPage";

export const metadata: Metadata = {
  title: "הסל",
  description: "גופי התאורה שבחרתם — מחירי הדגמה כולל מע״מ. בקשת הצעת מחיר ללקוחות פרטיים.",
};

export default function Page() {
  return <CartPage />;
}

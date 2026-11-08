import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, David_Libre, Heebo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { KelvinProvider } from "@/components/light/KelvinProvider";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Header } from "@/components/brand/Header";
import { Footer } from "@/components/brand/Footer";
import { SkipLink } from "@/components/brand/SkipLink";
import { DemoBadge } from "@/components/brand/DemoBadge";
import { Preloader } from "@/components/brand/Preloader";
import { DimmerCursor } from "@/components/brand/DimmerCursor";

const david = David_Libre({ subsets: ["hebrew", "latin"], weight: ["400", "500", "700"], variable: "--font-david", display: "swap" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-heebo", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });

export const metadata: Metadata = {
  title: { default: "קמחי תאורה — האור נדלק (קונספט)", template: "%s · קמחי תאורה (קונספט)" },
  description: "קונספט של Kikkey לאתר ופורטל מעצבים עבור קמחי תאורה. לא האתר הרשמי. מחירי הדגמה בלבד.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  applicationName: "Kamchi — concept",
  other: { "format-detection": "telephone=no" },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" data-kelvin="2700" className={`${david.variable} ${heebo.variable} ${plex.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className="bg-night text-paper font-ui antialiased">
        <KelvinProvider>
          <SkipLink />
          <Preloader />
          <SmoothScroll>
            <Header />
            <main id="main" tabIndex={-1} className="min-h-[70dvh] outline-none">
              {children}
            </main>
            <Footer />
          </SmoothScroll>
          <DemoBadge />
          <DimmerCursor />
        </KelvinProvider>
      </body>
    </html>
  );
}

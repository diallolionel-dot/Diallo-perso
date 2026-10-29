import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Diallo Coaching",
    template: "%s · Diallo Coaching",
  },
  description: "Coaching sportif et nutritionnel personnel — suivi, régularité, progression.",
  applicationName: "Diallo Coaching",
  appleWebApp: {
    capable: true,
    title: "Diallo Coaching",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#04070d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${cinzel.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-night-800 focus:px-3 focus:py-2"
        >
          Aller au contenu
        </a>
        <main id="contenu" className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pb-28 pt-safe">
          <div className="pt-4" />
          {children}
        </main>
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

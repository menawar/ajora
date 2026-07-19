import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { LanguageProvider } from "../lib/i18n";
import { WalletProvider } from "../hooks/useWallet";
import { ThemeProvider } from "../hooks/useTheme";
import { TabBar } from "../components/TabBar";
import { OfflineBanner } from "../components/OfflineBanner";
import { PageTransition } from "../components/PageTransition";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ajora-4ewr.vercel.app"),
  title: "Ajora — Save small, chop jara",
  description:
    "No-loss prize-linked savings game on Celo. Save small, keep every cent, win the daily draw.",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ajora",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Ajora — Save small, chop jara",
    description: "No-loss prize-linked savings game on Celo. Save small, keep every cent, win the daily draw.",
    url: "https://ajora-4ewr.vercel.app",
    siteName: "Ajora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ajora — Save small, chop jara",
    description: "No-loss prize-linked savings game on Celo.",
  },
  // Talent Protocol (Proof of Ship) project-ownership verification tag.
  other: {
    "talentapp:project_verification":
      "99eaa36dba6294d4109782b53f8b7d9ac2708fa0acfb322e4d1dd3db7c6631cb3c7c0b509971d6fd6dd98c05d76c659046c5894e17cbde20b18ea83808d8076d",
  },
};

export const viewport: Viewport = {
  themeColor: "#35d07f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-dvh bg-bg-primary pb-16 font-sans text-text-primary antialiased transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider>
            <WalletProvider>
              <OfflineBanner />
              <PageTransition>
                {children}
              </PageTransition>
              <TabBar />
            </WalletProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { WalletProvider } from "../hooks/useWallet";
import { TabBar } from "../components/TabBar";
import { OfflineBanner } from "../components/OfflineBanner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ajora-4ewr.vercel.app"),
  title: "Ajora — Save small, chop jara",
  description:
    "No-loss prize-linked savings game on Celo. Save small, keep every cent, win the daily draw.",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
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
    <html lang="en">
      <body className="min-h-dvh bg-white pb-16 text-gray-900 antialiased">
        <WalletProvider>
          <OfflineBanner />
          {children}
          <TabBar />
        </WalletProvider>
      </body>
    </html>
  );
}

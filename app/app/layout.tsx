import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ajora — Save small, chop jara",
  description:
    "No-loss prize-linked savings game on Celo. Save small, keep every cent, win the daily draw.",
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
      <body className="min-h-dvh bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}

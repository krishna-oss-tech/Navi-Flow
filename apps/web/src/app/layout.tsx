import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NAVI-FLOW | Nagpur Real-Time Traffic Intelligence & Decision Support",
  description:
    "Real-time traffic intelligence, risk estimation, route ranking, and police resource optimization for Nagpur. Manthan4Yuva Hackathon 2026.",
  keywords: ["traffic", "Nagpur", "real-time", "intelligence", "ITMS", "smart city"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#070a0f] text-slate-100 antialiased overflow-hidden min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}

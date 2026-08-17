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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface h-screen w-screen overflow-hidden flex flex-col font-body-lg antialiased">
        {children}
      </body>
    </html>
  );
}

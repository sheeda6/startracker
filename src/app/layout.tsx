import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StarTracker — Real-Time Astronomical Sky Tracker",
  description:
    "High-performance interactive sky map with real-time star positions, accurate astronomical calculations, multiple coordinate systems, rise/transit/set times, and a searchable bright-star catalog.",
  keywords: [
    "astronomy",
    "sky map",
    "star tracker",
    "celestial coordinates",
    "Hipparcos",
    "sidereal time",
    "rise set transit",
    "constellations",
  ],
  authors: [{ name: "StarTracker" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "StarTracker — Real-Time Astronomical Sky Tracker",
    description: "Interactive sky map with real-time star positions and accurate astronomical calculations.",
    siteName: "StarTracker",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

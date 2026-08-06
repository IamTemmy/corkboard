import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Body & UI text — the workhorse font for everything that isn't a heading or price.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Display — headings and the "corkboard" wordmark. Gives the brand its character.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

// Prices ONLY — set like a receipt / price tag. This is a deliberate signature detail.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Corkboard — Buy and sell with people on your campus",
  description:
    "A campus marketplace for verified students. No shipping, no fees — just students down the hall.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

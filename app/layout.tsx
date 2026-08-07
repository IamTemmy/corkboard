import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { siteUrl } from "@/lib/site";
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

const siteTitle = "Corkboard — Buy and sell with people on your campus";
const siteDescription =
  "A campus marketplace for verified students. No shipping, no fees — just students down the hall.";

export const metadata: Metadata = {
  // Makes relative URLs (like the auto-generated preview image) resolve to the
  // live domain. Update this if the domain ever changes.
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  // Open Graph powers the rich link card in iMessage, WhatsApp, Slack, etc.
  // The preview image comes automatically from app/opengraph-image.tsx.
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "Corkboard",
    type: "website",
  },
  // Twitter/X uses its own tags; "summary_large_image" shows the big card.
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
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

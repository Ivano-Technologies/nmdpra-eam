import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono, Inter, Playfair_Display, Space_Grotesk } from "next/font/google";

import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

/** Web fallback for brand font Ceoruse (see globals.css --font-brand). */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"]
});

/** Web fallback for heading font Gonero (see globals.css --font-heading). */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["500", "600", "700"]
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: BRAND_NAME,
    template: `%s | ${BRAND_NAME}`
  },
  description: BRAND_DESCRIPTION,
  applicationName: BRAND_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/techivano-mark.png", sizes: "any", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    siteName: BRAND_NAME,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    description: BRAND_DESCRIPTION
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${playfair.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="font-sans flex min-h-full flex-col">
        <ThemeProvider>
          <ClerkProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster richColors position="top-right" closeButton />
            </TooltipProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono, Inter, Montserrat, Open_Sans } from "next/font/google";

import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open"
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-mont"
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "RMLIS — Regulatory Intelligence System",
  description:
    "Monitor vendor license compliance, detect risks, and generate automated reports."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${openSans.variable} ${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col">
        <ClerkProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ClerkProvider>
      </body>
    </html>
  );
}

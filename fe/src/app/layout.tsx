import { fonts } from "@/lib/fonts";
import "@/lib/typography.css";
import type { Metadata } from "next";
import Script from "next/script";
import ClientBody from "./ClientBody";
import "./globals.css";

export const metadata: Metadata = {
  title: "PersonaVault - AI-Powered Knowledge Management",
  description: "Your intelligent document vault that seamlessly connects to LLMs, keeping your AI always up-to-date with your personal knowledge base.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${fonts.inter.variable} ${fonts.poppins.variable} ${fonts.jetbrainsMono.variable}`}>
      <head>
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />
      </head>
      <body suppressHydrationWarning className="antialiased font-sans bg-background">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}

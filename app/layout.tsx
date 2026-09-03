import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/500.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import { LocaleProvider } from "@/components/i18n/locale-provider";

export const metadata: Metadata = {
  title: "Masdr — AI Tech Pack Generator",
  description:
    "Turn a product photo and a plain-language description into a structured, editable manufacturing tech pack — BOM, POM measurements, construction, colourways and QC — with provenance on every field.",
};

export const viewport: Viewport = {
  themeColor: "#080412",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

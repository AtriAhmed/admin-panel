import type { Metadata } from "next";
import {
  Anton,
  Bricolage_Grotesque,
  DM_Sans,
  Figtree,
  Fraunces,
  Fredoka,
  Geist,
  Hanken_Grotesk,
  Instrument_Sans,
  Inter,
  Public_Sans,
  Varela_Round,
} from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const anton = Anton({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-anton",
  weight: "400",
});
const bricolageGrotesque = Bricolage_Grotesque({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-bricolage-grotesque",
});
const dmSans = DM_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-dm-sans",
});
const figtree = Figtree({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-figtree",
});
const fraunces = Fraunces({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-fraunces",
});
const fredoka = Fredoka({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-fredoka",
});
const geist = Geist({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-geist",
});
const hankenGrotesk = Hanken_Grotesk({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
});
const instrumentSans = Instrument_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});
const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});
const publicSans = Public_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-public-sans",
});
const varelaRound = Varela_Round({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-varela-round",
  weight: "400",
});

const fontVariables = [
  anton.variable,
  bricolageGrotesque.variable,
  dmSans.variable,
  figtree.variable,
  fraunces.variable,
  fredoka.variable,
  geist.variable,
  hankenGrotesk.variable,
  instrumentSans.variable,
  inter.variable,
  publicSans.variable,
  varelaRound.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "HeroUI Pro admin panel foundation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`bg-background text-foreground h-full ${fontVariables}`}
    >
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import { InspirationVerse } from "@/components/layout/inspiration-verse";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Side Hustle Matcher",
  description: "Practical side hustle recommendations based on your real role, skills, and constraints.",
  icons: {
    icon: "/side-hustle-logo.svg",
    shortcut: "/side-hustle-logo.svg",
    apple: "/side-hustle-logo.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${plexMono.variable} pb-20`}>
        {children}
        <InspirationVerse />
      </body>
    </html>
  );
}

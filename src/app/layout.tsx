import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
// Read by the video renderer for the "Display" typography option.
const display = Inter({ subsets: ["latin"], variable: "--font-display" });
export const metadata: Metadata = {
  title: "UnStuck — Content production for small businesses and agencies",
  description:
    "UnStuck turns your team's footage and daily notes into finished, on-brand social posts.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}

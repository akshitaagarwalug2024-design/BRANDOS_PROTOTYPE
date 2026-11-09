import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BRANDOS — Make something worth sharing",
  description:
    "From raw content to ready-to-post. Your calm, guided content studio.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

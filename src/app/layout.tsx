import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heir of Wisdom",
  description:
    "Cognitive-learning practice for CogAT, OLSAT and NNAT, with visual explanations that make the reasoning behind each answer visible.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calendar Curator",
  description: "Curate your calendar events with custom rules",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

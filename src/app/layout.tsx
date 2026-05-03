import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveTune MVP",
  description: "A smart web radio MVP powered by YouTube Live embeds."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import "@/app/globals.css";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const displayFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Asisten Riset AI",
  description: "Ruang kerja untuk pertanyaan, bukti, dan masukan dosen.",
  metadataBase: new URL("https://asisten-riset-ai.vercel.app")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={bodyFont.variable + " " + displayFont.variable}>{children}</body>
    </html>
  );
}


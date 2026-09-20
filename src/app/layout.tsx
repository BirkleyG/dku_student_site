import type { Metadata } from "next";
import { Instrument_Serif, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DKU Life",
  description:
    "One home for everything happening at Duke Kunshan University — events, food, news, and the wisdom of everyone who came before you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col bg-white text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import GameProvider from "@/components/game/GameProvider";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "CHIRAG TANK: THE TRAINING SIMULATOR",
  description: "23 engineers. 3 months. 1 instructor. A game built as a thank-you.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#090b10" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}

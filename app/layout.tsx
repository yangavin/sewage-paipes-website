import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sewage pAIpes — AI Puzzle Laboratory",
  description:
    "Connect the pipes to solve the puzzle. Rotate pipes to create a complete network, or watch the AI solve it for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          async
          src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
        ></script>
      </head>
      <body className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-border bg-[#ebe8de] px-4 py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold tracking-[-0.02em]">Sewage pAIpes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                An AI puzzle experiment by Gavin Yan and Ewan Byrne.
              </p>
            </div>
            <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <a href="#play" className="transition-colors hover:text-primary">Play</a>
              <a href="#ai-solver" className="transition-colors hover:text-primary">AI Solver</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

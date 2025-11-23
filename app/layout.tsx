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
  title: "Pipe Puzzle Game with AI Solver",
  description:
    "Connect the pipes to solve the puzzle. Rotate pipes to create a complete network, or watch the AI solve it for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
        ></script>
      </head>
      <body className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <footer className="mint-accent border-t border-border py-12 px-4 mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center items-center">
              <p className="text-sm text-muted-foreground handwritten">
                Made by Gavin Yan and Ewan Byrne
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

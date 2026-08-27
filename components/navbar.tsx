"use client";

import Link from "next/link";

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Navbar() {
  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-3xl transition-transform group-hover:rotate-12">🔧</span>
          <span className="text-xl font-semibold tracking-tight">
            Pipe Puzzle
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <a
            href="#play"
            onClick={(e) => scrollToSection(e, "play")}
            className="text-base font-medium text-muted-foreground transition-all hover:text-primary"
          >
            Play
          </a>
          <a
            href="#ai-solver"
            onClick={(e) => scrollToSection(e, "ai-solver")}
            className="text-base font-medium text-muted-foreground transition-all hover:text-primary"
          >
            AI Solver
          </a>
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { ArrowDownRight } from "lucide-react";

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-3" aria-label="Sewage pAIpes home">
          <span className="grid size-9 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover:rotate-12">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
              <path d="M12 3v6a3 3 0 0 0 3 3h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M3 21v-6a3 3 0 0 1 3-3h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2.25" fill="currentColor" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block text-[15px] font-bold tracking-[-0.03em]">Sewage pAIpes</span>
            <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground sm:block">AI puzzle laboratory</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <a
            href="#play"
            onClick={(e) => scrollToSection(e, "play")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground sm:px-4"
          >
            Play
          </a>
          <a
            href="#ai-solver"
            onClick={(e) => scrollToSection(e, "ai-solver")}
            className="group flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-all hover:bg-primary sm:px-4"
          >
            <span className="hidden sm:inline">AI Solver</span>
            <span className="sm:hidden">AI</span>
            <ArrowDownRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

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
          <Link
            href="/"
            className={cn(
              "text-base font-medium transition-all hover:text-primary relative",
              pathname === "/" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Play
            {pathname === "/" && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
            )}
          </Link>
          <Link
            href="/ai"
            className={cn(
              "text-base font-medium transition-all hover:text-primary relative",
              pathname === "/ai" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            AI Solver
            {pathname === "/ai" && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}

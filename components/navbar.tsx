"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Home
          </Link>
          <Link
            href="/ai"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/ai" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            AI Solver
          </Link>
        </div>
      </div>
    </nav>
  );
}

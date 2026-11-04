import PlayableBoard from "./PlayableBoard";
import AiSolverSection from "./ai/AiSolverSection";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  ExternalLink,
  FileText,
  Network,
  RotateCw,
} from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="hero-section px-4 pb-20 pt-14 sm:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
          <div className="relative z-10">
            <div className="eyebrow mb-6">
              <span className="status-dot" />
              Interactive AI experiment
            </div>
            <h1 className="max-w-3xl">
              Untangle the network.
              <span className="block text-primary">Outsmart the grid.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Rotate every pipe into one connected system, then put our neural
              solver to the same test. A classic logic puzzle, rebuilt as an AI
              playground.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="group">
                <a href="#play">
                  Start a puzzle
                  <ArrowDown className="transition-transform group-hover:translate-y-0.5" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href="https://drive.google.com/file/d/1nAALKDSmRvLRF1EKkZxdUTLBAGwa15Zi/view"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText />
                  Read the research
                  <ExternalLink className="size-3.5 opacity-60" />
                </a>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-border/80 pt-6 text-sm text-muted-foreground">
              <span><strong className="text-foreground">2–25</strong> grid sizes</span>
              <span><strong className="text-foreground">3</strong> AI approaches</span>
              <span><strong className="text-foreground">∞</strong> configurations</span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-visual__label">NETWORK // 04 × 04</div>
            <div className="hero-grid">
              {[3, 1, 3, 1, 4, 3, 4, 2, 2, 4, 3, 1, 3, 2, 4, 3].map(
                (type, index) => (
                  <div className="hero-tile" key={index}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/type${type}.svg`}
                      alt=""
                      style={{ transform: `rotate(${[1, 2, 3, 0][index % 4] * 90}deg)` }}
                    />
                  </div>
                )
              )}
            </div>
            <div className="hero-visual__status">
              <span>Puzzle matrix</span>
              <span>16 tiles</span>
            </div>
            <div className="hero-sticker">AI<br />LAB</div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="section-heading mb-10 max-w-2xl">
            <div className="eyebrow">How it works</div>
            <h2 className="mt-4">Simple rules. Surprisingly deep.</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {[
              { icon: RotateCw, number: "01", title: "Rotate", text: "Turn each tile in 90° steps to aim its openings." },
              { icon: Network, number: "02", title: "Connect", text: "Build one continuous network with zero loose ends." },
              { icon: BrainCircuit, number: "03", title: "Challenge AI", text: "Design a board and watch the model reason through it." },
            ].map(({ icon: Icon, number, title, text }) => (
              <article className="feature-card" key={number}>
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">{number}</span>
                </div>
                <h3 className="mt-10 text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="play" className="dark-section scroll-mt-20 px-4 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <div>
              <div className="eyebrow eyebrow--dark">Puzzle console / 01</div>
              <h2 className="mt-4 text-white">Build a clean connection.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/60 lg:justify-self-end">
              Pick a board size and click any pipe to rotate it. Every segment
              must join the same network—with no connection pointing into empty space.
            </p>
          </div>
          <PlayableBoard />
        </div>
      </section>

      <section id="ai-solver" className="scroll-mt-20 px-4 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <AiSolverSection />
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="cta-panel mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-3xl p-8 sm:p-12 lg:flex-row lg:items-center">
          <div>
            <div className="eyebrow eyebrow--dark">Under the surface</div>
            <h2 className="mt-4 max-w-2xl text-white">Three different kinds of intelligence. One deceptively small puzzle.</h2>
          </div>
          <Button asChild variant="secondary" size="lg" className="shrink-0 group">
            <a
              href="https://drive.google.com/file/d/1nAALKDSmRvLRF1EKkZxdUTLBAGwa15Zi/view"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore the report
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}

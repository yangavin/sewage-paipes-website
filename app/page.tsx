import PlayableBoard from "./PlayableBoard";

export default function Home() {
  return (
    <>
      {/* Philosophy Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="mb-8">About the Puzzle</h2>
          <div className="space-y-6 text-lg text-muted-foreground">
            <p className="text-balance">
              The pipe connection puzzle is a classic logic game. Each tile
              contains a pipe segment that can be rotated to connect with its
              neighbors.
            </p>
            <p className="text-balance">
              Your goal is to rotate all the pipes so they form a complete,
              connected network with no loose ends. It&apos;s a test of{" "}
              <span className="highlight-pink">spatial reasoning</span> and
              systematic problem-solving.
            </p>
            <p className="handwritten text-2xl text-foreground mt-8">
              Every pipe has a purpose
            </p>
          </div>
        </div>
      </section>

      {/* Puzzle Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">Play the Puzzle</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Click any pipe to rotate it. Try to connect all the pipes into a
              complete network, or let the AI show you the solution.
            </p>
          </div>
          <PlayableBoard />
        </div>
      </section>
    </>
  );
}
